/**
 * Generate Templates for All Niches
 * 
 * This script generates beautiful, customized Shopify themes for all niches
 * in the database. Each theme is tailored to the specific niche with:
 * - Custom color schemes and typography
 * - Niche-specific headings and content
 * - Modern animations and effects
 * - All required pages and sections
 * 
 * Usage: npx ts-node scripts/generate-niche-templates.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import { Niche } from '../src/models/Niche';
import { Template, ITemplate } from '../src/models/Template';
import { User } from '../src/models/User';
import { generateCompleteTheme } from '../src/services/OpenAIService';
import { getNicheTheme, getAllNicheThemes, defaultTheme } from '../src/config/nicheThemes';
import * as fs from 'fs';

// Configuration
const CONFIG = {
  // Set to true to overwrite existing templates
  OVERWRITE_EXISTING: false,
  // Set to true to only generate for niches without templates
  SKIP_IF_EXISTS: true,
  // Delay between generations (ms) to avoid rate limits
  DELAY_BETWEEN_GENERATIONS: 2000,
  // Template category
  CATEGORY: 'niche' as const,
};

interface GenerationResult {
  niche: string;
  success: boolean;
  templateId?: string;
  error?: string;
  skipped?: boolean;
}

/**
 * Connect to MongoDB
 */
async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅ MongoDB connected successfully');
}

/**
 * Get or create admin user for template ownership
 */
async function getAdminUser(): Promise<mongoose.Types.ObjectId> {
  const admin = await User.findOne({ role: 'admin' }).select('_id');
  
  if (!admin) {
    throw new Error('No admin user found. Please create an admin user first.');
  }
  
  return admin._id as mongoose.Types.ObjectId;
}

/**
 * Generate slug from niche name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[&\/]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

/**
 * Create template folder with all theme files
 */
async function createTemplateFolder(
  slug: string,
  themeFiles: {
    layout: { path: string; content: string };
    sections: Array<{ path: string; content: string }>;
    templates: Array<{ path: string; content: string }>;
    assets: Array<{ path: string; content: string }>;
    config: Array<{ path: string; content: string }>;
  }
): Promise<void> {
  const templatesDir = path.join(__dirname, '../templates');
  const templatePath = path.join(templatesDir, slug);

  // Create directory structure
  const dirs = [
    templatePath,
    path.join(templatePath, 'layout'),
    path.join(templatePath, 'sections'),
    path.join(templatePath, 'templates'),
    path.join(templatePath, 'assets'),
    path.join(templatePath, 'config'),
    path.join(templatePath, 'snippets'),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Write layout file
  if (themeFiles.layout.content) {
    fs.writeFileSync(
      path.join(templatePath, themeFiles.layout.path),
      themeFiles.layout.content
    );
  }

  // Write sections
  for (const section of themeFiles.sections) {
    if (section.content) {
      fs.writeFileSync(path.join(templatePath, section.path), section.content);
    }
  }

  // Write templates
  for (const template of themeFiles.templates) {
    if (template.content) {
      fs.writeFileSync(path.join(templatePath, template.path), template.content);
    }
  }

  // Write assets
  for (const asset of themeFiles.assets) {
    if (asset.content) {
      fs.writeFileSync(path.join(templatePath, asset.path), asset.content);
    }
  }

  // Write config
  for (const configFile of themeFiles.config) {
    if (configFile.content) {
      fs.writeFileSync(path.join(templatePath, configFile.path), configFile.content);
    }
  }

  // Create meta.json
  const nicheTheme = getNicheTheme(slug) || defaultTheme;
  const meta = {
    name: nicheTheme.name,
    version: '1.0.0',
    author: 'Theme Generator',
    description: `Custom theme for ${nicheTheme.name} niche`,
    category: 'niche',
    niche: nicheTheme.name,
    colors: nicheTheme.colors,
    typography: nicheTheme.typography,
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(templatePath, 'meta.json'),
    JSON.stringify(meta, null, 2)
  );

  console.log(`  📁 Created template folder: ${templatePath}`);
}

/**
 * Generate template for a single niche
 */
async function generateNicheTemplate(
  nicheName: string,
  adminUserId: mongoose.Types.ObjectId
): Promise<GenerationResult> {
  const slug = generateSlug(nicheName);
  
  console.log(`\n🎨 Generating template for: ${nicheName}`);
  console.log(`   Slug: ${slug}`);

  try {
    // Check if template already exists
    const existingTemplate = await Template.findOne({
      $or: [
        { slug },
        { name: { $regex: new RegExp(`^${nicheName}$`, 'i') } },
      ],
      isDeleted: { $ne: true },
    });

    if (existingTemplate && CONFIG.SKIP_IF_EXISTS && !CONFIG.OVERWRITE_EXISTING) {
      console.log(`   ⏭️  Template already exists, skipping...`);
      return {
        niche: nicheName,
        success: true,
        skipped: true,
        templateId: (existingTemplate._id as any).toString(),
      };
    }

    if (existingTemplate && CONFIG.OVERWRITE_EXISTING) {
      console.log(`   🔄 Overwriting existing template...`);
      await Template.findByIdAndDelete(existingTemplate._id);
    }

    // Get niche theme configuration
    const nicheTheme = getNicheTheme(nicheName);
    if (!nicheTheme) {
      console.log(`   ⚠️  No specific theme config found, using defaults`);
    } else {
      console.log(`   ✓ Found niche theme config: ${nicheTheme.name}`);
    }

    // Generate complete theme
    console.log(`   🔧 Generating theme files...`);
    const themeFiles = await generateCompleteTheme(
      `Premium ${nicheName} store with modern design`,
      slug,
      nicheName
    );

    // Create template folder
    await createTemplateFolder(slug, themeFiles);

    // Count files
    const fileCount = 
      1 + // layout
      themeFiles.sections.length +
      themeFiles.templates.length +
      themeFiles.assets.length +
      themeFiles.config.length;

    console.log(`   ✓ Generated ${fileCount} theme files`);

    // Create template record in database
    const templateData: Partial<ITemplate> = {
      name: `${nicheName} Theme`,
      slug,
      description: `Professional Shopify theme designed for ${nicheName} stores. Features modern animations, responsive design, and conversion-optimized layouts.`,
      category: CONFIG.CATEGORY,
      tags: [
        nicheName.toLowerCase(),
        'modern',
        'responsive',
        'animated',
        'conversion-optimized',
      ],
      version: '1.0.0',
      previewImages: nicheTheme?.images ? [nicheTheme.images.hero] : [],
      isActive: true,
      isPublished: true,
      isPremium: false,
      createdBy: adminUserId,
      stats: {
        downloads: 0,
        views: 0,
        rating: 5,
        reviewCount: 0,
      },
      features: [
        'Modern animations',
        'Responsive design',
        'SEO optimized',
        'Fast loading',
        'Custom color scheme',
        'Trust badges',
        'Newsletter section',
        'Testimonials',
      ],
      compatibility: {
        shopifyVersion: '2.0',
        features: ['sections', 'json-templates', 'theme-editor'],
      },
    };

    const template = new Template(templateData);
    await template.save();

    console.log(`   ✅ Template saved to database: ${template._id}`);

    return {
      niche: nicheName,
      success: true,
      templateId: (template._id as any).toString(),
    };

  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return {
      niche: nicheName,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main function to generate all niche templates
 */
async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     🎨 Niche Template Generator for Shopify Themes 🎨      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Connect to database
    await connectDB();

    // Get admin user
    const adminUserId = await getAdminUser();
    console.log(`👤 Using admin user: ${adminUserId}\n`);

    // Get all niches from database
    console.log('📋 Fetching niches from database...');
    const dbNiches = await Niche.find({ isActive: true }).select('name').lean();
    
    // Get all predefined niche themes
    const predefinedThemes = getAllNicheThemes();
    
    // Combine both sources (database niches + predefined themes)
    const nicheNames = new Set<string>();
    
    // Add database niches
    dbNiches.forEach(niche => nicheNames.add(niche.name));
    
    // Add predefined theme niches
    predefinedThemes.forEach(theme => nicheNames.add(theme.name));

    const niches = Array.from(nicheNames);
    console.log(`✓ Found ${niches.length} niches to process\n`);

    if (niches.length === 0) {
      console.log('⚠️  No niches found. Please add niches to the database first.');
      return;
    }

    // Print niches to be processed
    console.log('Niches to process:');
    niches.forEach((name, i) => {
      const hasTheme = getNicheTheme(name) ? '✓' : '○';
      console.log(`  ${i + 1}. ${hasTheme} ${name}`);
    });
    console.log('');

    // Generate templates
    const results: GenerationResult[] = [];
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (let i = 0; i < niches.length; i++) {
      const niche = niches[i];
      console.log(`\n[${i + 1}/${niches.length}] Processing: ${niche}`);
      
      const result = await generateNicheTemplate(niche, adminUserId);
      results.push(result);

      if (result.skipped) {
        skipCount++;
      } else if (result.success) {
        successCount++;
      } else {
        failCount++;
      }

      // Delay between generations
      if (i < niches.length - 1 && !result.skipped) {
        console.log(`   ⏳ Waiting ${CONFIG.DELAY_BETWEEN_GENERATIONS}ms before next...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_GENERATIONS));
      }
    }

    // Print summary
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    📊 GENERATION SUMMARY                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Total niches processed: ${niches.length}`);
    console.log(`✅ Successfully generated: ${successCount}`);
    console.log(`⏭️  Skipped (already exists): ${skipCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('');

    // Print detailed results
    if (failCount > 0) {
      console.log('Failed templates:');
      results
        .filter(r => !r.success && !r.skipped)
        .forEach(r => console.log(`  ❌ ${r.niche}: ${r.error}`));
      console.log('');
    }

    console.log('Generated templates:');
    results
      .filter(r => r.success && !r.skipped)
      .forEach(r => console.log(`  ✅ ${r.niche} (ID: ${r.templateId})`));

    if (skipCount > 0) {
      console.log('\nSkipped templates (already exist):');
      results
        .filter(r => r.skipped)
        .forEach(r => console.log(`  ⏭️  ${r.niche} (ID: ${r.templateId})`));
    }

    console.log('\n✨ Template generation complete!\n');

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
main().catch(console.error);

