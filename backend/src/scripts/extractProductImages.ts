/**
 * Extract all product image references from the DB and save a name-wise, structure-wise report.
 * Use this to see exactly what image values exist (paths, URLs, labels) and name them by product/niche.
 *
 * Output:
 *   - exports/images-manifest-{timestamp}.json  (full structure)
 *   - exports/images-manifest-{timestamp}.csv  (flat table for spreadsheets)
 *
 * Run: npx ts-node src/scripts/extractProductImages.ts
 * Or:  npm run extract:product-images
 */

import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env';
import { Product } from '../models/Product';

const OUT_DIR = path.join(process.cwd(), 'exports');

type ImageStructureType = 'relative_path' | 'absolute_url' | 'invalid_or_label';

interface ImageEntry {
  productId: string;
  productTitle: string;
  nicheId: string;
  nicheName: string;
  nicheSlug: string;
  imageIndex: number;
  rawValue: string;
  structureType: ImageStructureType;
  hasExtension: boolean;
  extension: string | null;
  suggestedFilename: string;
}

function classifyImageValue(raw: string): { type: ImageStructureType; extension: string | null } {
  const s = (raw && typeof raw === 'string' ? raw : '').trim();
  if (!s) return { type: 'invalid_or_label', extension: null };
  if (s.startsWith('http://') || s.startsWith('https://')) {
    try {
      const ext = path.extname(new URL(s).pathname) || null;
      return { type: 'absolute_url', extension: ext ? ext.replace(/^\./, '') : null };
    } catch {
      return { type: 'absolute_url', extension: null };
    }
  }
  if (s.startsWith('/') || s.includes('/')) {
    const ext = path.extname(s.split('?')[0]) || null;
    return { type: 'relative_path', extension: ext ? ext.replace(/^\./, '') : null };
  }
  const ext = path.extname(s) || null;
  if (ext) return { type: 'relative_path', extension: ext.replace(/^\./, '') };
  return { type: 'invalid_or_label', extension: null };
}

function slugify(str: string, maxLen = 40): string {
  const s = str
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLen);
  return s || 'unnamed';
}

function suggestedFilename(entry: ImageEntry): string {
  const base = `${entry.nicheSlug}_${entry.productId.slice(-6)}_${entry.imageIndex}_${slugify(entry.productTitle, 25)}`;
  const ext = entry.extension || 'bin';
  return `${base}.${ext}`;
}

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected.\n');

    const products = await Product.find({})
      .populate('niche', 'name slug')
      .lean();

    const entries: ImageEntry[] = [];
    const seen = new Set<string>();

    for (const p of products) {
      const raw = (p as any).images;
      const arr = Array.isArray(raw) ? raw : [];
      const niche = (p as any).niche;
      const nicheId = niche?._id?.toString() ?? '';
      const nicheName = (niche?.name ?? '') || 'no-niche';
      const nicheSlug = (niche?.slug ?? '') || 'no-niche';
      const productId = (p as any)._id?.toString() ?? '';
      const productTitle = (p as any).title ?? '';

      for (let i = 0; i < arr.length; i++) {
        const rawValue = typeof arr[i] === 'string' ? arr[i] : String(arr[i]);
        const { type, extension } = classifyImageValue(rawValue);
        const entry: ImageEntry = {
          productId,
          productTitle,
          nicheId,
          nicheName,
          nicheSlug,
          imageIndex: i,
          rawValue,
          structureType: type,
          hasExtension: !!extension,
          extension: extension || null,
          suggestedFilename: '', // set below
        };
        entry.suggestedFilename = suggestedFilename(entry);
        entries.push(entry);
        seen.add(rawValue);
      }
    }

    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const jsonPath = path.join(OUT_DIR, `images-manifest-${timestamp}.json`);
    const csvPath = path.join(OUT_DIR, `images-manifest-${timestamp}.csv`);

    const report = {
      generatedAt: new Date().toISOString(),
      totalProducts: products.length,
      totalImageEntries: entries.length,
      uniqueRawValues: seen.size,
      byStructureType: {
        relative_path: entries.filter((e) => e.structureType === 'relative_path').length,
        absolute_url: entries.filter((e) => e.structureType === 'absolute_url').length,
        invalid_or_label: entries.filter((e) => e.structureType === 'invalid_or_label').length,
      },
      entries,
    };

    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
    console.log('Wrote:', jsonPath);

    const headers = [
      'productId',
      'productTitle',
      'nicheSlug',
      'nicheName',
      'imageIndex',
      'rawValue',
      'structureType',
      'extension',
      'suggestedFilename',
    ];
    const csvRows = [headers.join(',')];
    for (const e of entries) {
      const row = [
        e.productId,
        `"${(e.productTitle || '').replace(/"/g, '""')}"`,
        e.nicheSlug,
        `"${(e.nicheName || '').replace(/"/g, '""')}"`,
        e.imageIndex,
        `"${(e.rawValue || '').replace(/"/g, '""')}"`,
        e.structureType,
        e.extension || '',
        e.suggestedFilename,
      ];
      csvRows.push(row.join(','));
    }
    fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf8');
    console.log('Wrote:', csvPath);

    console.log('\nSummary:');
    console.log('  Products:', report.totalProducts);
    console.log('  Image entries:', report.totalImageEntries);
    console.log('  Unique raw values:', report.uniqueRawValues);
    console.log('  relative_path:', report.byStructureType.relative_path);
    console.log('  absolute_url:', report.byStructureType.absolute_url);
    console.log('  invalid_or_label:', report.byStructureType.invalid_or_label);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
}

run();
