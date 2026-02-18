/**
 * One-time script: Clean product images in the database.
 * - Keeps only entries that look like real URLs/paths (drops labels like "Upload 1").
 * - Replaces empty image arrays with a single placeholder path so every product has at least one image.
 * - Ensures the placeholder file exists under public/uploads/.
 *
 * Run on the server (or locally with MONGODB_URI):
 *   npx ts-node src/scripts/fixProductImages.ts
 * Or: npm run fix:product-images
 */

import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env';
import { Product } from '../models/Product';
import {
  isValidImageUrlOrPath,
  PLACEHOLDER_PRODUCT_IMAGE_PATH,
} from '../utils/imageUrl';

// Minimal 1x1 transparent PNG (so placeholder file always exists)
const MINIMAL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function ensurePlaceholderFile(): void {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const placeholderPath = path.join(uploadsDir, 'placeholder-product.png');
  if (fs.existsSync(placeholderPath)) {
    console.log('  Placeholder file already exists:', placeholderPath);
    return;
  }
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('  Created directory:', uploadsDir);
  }
  const buf = Buffer.from(MINIMAL_PNG_BASE64, 'base64');
  fs.writeFileSync(placeholderPath, buf);
  console.log('  Created placeholder file:', placeholderPath);
}

async function fixProductImages() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected.\n');

    console.log('Ensuring placeholder image exists...');
    ensurePlaceholderFile();
    console.log('');

    const products = await Product.find({}).lean();
    console.log(`Found ${products.length} products. Processing...\n`);

    let updated = 0;
    let emptied = 0; // products that had only invalid images and got placeholder

    for (const p of products) {
      const raw = (p as any).images;
      const arr = Array.isArray(raw) ? raw : [];
      const validOnly = arr.filter(
        (url: unknown) => typeof url === 'string' && isValidImageUrlOrPath(url)
      );
      const newImages =
        validOnly.length > 0 ? validOnly : [PLACEHOLDER_PRODUCT_IMAGE_PATH];

      if (validOnly.length === 0 && arr.length > 0) emptied++;

      const same =
        newImages.length === arr.length &&
        newImages.every((v, i) => v === arr[i]);
      if (same) continue;

      await Product.updateOne(
        { _id: p._id },
        { $set: { images: newImages } }
      );
      updated++;
      console.log(
        `  Updated: ${(p as any).title?.slice(0, 40)} (id: ${p._id})`
      );
    }

    console.log('\nDone.');
    console.log(`  Products updated: ${updated}`);
    console.log(`  Products that had only invalid images (now use placeholder): ${emptied}`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
}

fixProductImages();
