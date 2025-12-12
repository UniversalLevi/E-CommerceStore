import mongoose from 'mongoose';
import { generateCompleteTheme } from '../src/services/OpenAIService';
import * as templateService from '../src/services/templateService';
import { Template } from '../src/models/Template';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function testThemeGeneration() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eazy-dropshipping';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Find an existing template or use the most recent one
    let template = await Template.findOne({ 
      isDeleted: false,
      isActive: true 
    }).sort({ createdAt: -1 });
    
    if (!template) {
      console.log('❌ No active template found. Please create one via the admin panel.');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`✓ Using template: ${template.name} (${template._id})`);
    console.log(`  Slug: ${template.slug}`);

    // Test theme generation with a sample prompt
    const prompt = `Modern minimalist e-commerce theme with dark color scheme, elegant typography, and smooth animations`;

    console.log(`\n🔄 Generating theme with prompt: "${prompt.substring(0, 50)}..."`);
    
    const startTime = Date.now();
    const themeFiles = await generateCompleteTheme(prompt, template.name);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✓ Theme generated in ${duration}s`);
    console.log(`  Layout: ${themeFiles.layout.path} (${themeFiles.layout.content.length} chars)`);
    console.log(`  Sections: ${themeFiles.sections.length}`);
    themeFiles.sections.forEach(s => console.log(`    - ${s.path} (${s.content.length} chars)`));
    console.log(`  Templates: ${themeFiles.templates.length}`);
    themeFiles.templates.forEach(t => console.log(`    - ${t.path}`));
    console.log(`  Assets: ${themeFiles.assets.length}`);
    themeFiles.assets.forEach(a => console.log(`    - ${a.path} (${a.content.length} chars)`));
    console.log(`  Config: ${themeFiles.config.length}`);

    // Verify sections have dynamic content
    console.log('\n📋 Validating dynamic content...');
    
    const featuredProducts = themeFiles.sections.find(s => s.path.includes('featured-products'));
    if (featuredProducts) {
      const hasProductLoop = featuredProducts.content.includes('{% for product');
      const hasProductVars = featuredProducts.content.includes('{{ product.');
      console.log(`  featured-products.liquid:`);
      console.log(`    - Has product loop: ${hasProductLoop ? '✓' : '✗'}`);
      console.log(`    - Has product variables: ${hasProductVars ? '✓' : '✗'}`);
    }

    const collectionList = themeFiles.sections.find(s => s.path.includes('collection-list'));
    if (collectionList) {
      const hasCollectionLoop = collectionList.content.includes('{% for collection');
      const hasCollectionVars = collectionList.content.includes('{{ collection.');
      console.log(`  collection-list.liquid:`);
      console.log(`    - Has collection loop: ${hasCollectionLoop ? '✓' : '✗'}`);
      console.log(`    - Has collection variables: ${hasCollectionVars ? '✓' : '✗'}`);
    }

    const header = themeFiles.sections.find(s => s.path.includes('header'));
    if (header) {
      const hasShopName = header.content.includes('{{ shop.name');
      const hasCartCount = header.content.includes('{{ cart.');
      console.log(`  header.liquid:`);
      console.log(`    - Has shop name: ${hasShopName ? '✓' : '✗'}`);
      console.log(`    - Has cart data: ${hasCartCount ? '✓' : '✗'}`);
    }

    // Parse and display index.json template structure
    const indexJson = themeFiles.templates.find(t => t.path.includes('index.json'));
    if (indexJson) {
      try {
        const parsed = JSON.parse(indexJson.content);
        console.log('\n📄 templates/index.json structure:');
        console.log(`  Sections: ${Object.keys(parsed.sections || {}).join(', ')}`);
        console.log(`  Order: ${(parsed.order || []).join(' → ')}`);
        
        if (parsed.sections?.hero?.settings) {
          console.log(`\n  Hero settings:`);
          console.log(`    - Heading: "${parsed.sections.hero.settings.heading || 'N/A'}"`);
          console.log(`    - Subheading: "${(parsed.sections.hero.settings.subheading || 'N/A').substring(0, 50)}..."`);
        }
        
        if (parsed.sections?.['featured-products']?.settings) {
          console.log(`\n  Featured Products settings:`);
          console.log(`    - Heading: "${parsed.sections['featured-products'].settings.heading || 'N/A'}"`);
          console.log(`    - Products: ${parsed.sections['featured-products'].settings.products_to_show || 'N/A'}`);
        }
      } catch (e) {
        console.log('  ⚠️ Could not parse index.json');
      }
    }

    // Write files to the template folder for testing
    console.log('\n💾 Writing theme files to template folder...');
    
    let filesWritten = 0;
    let errors = 0;

    // Write layout
    try {
      await templateService.writeTemplateFile(template.slug, themeFiles.layout.path, themeFiles.layout.content);
      filesWritten++;
    } catch (e: any) {
      console.log(`  ✗ ${themeFiles.layout.path}: ${e.message}`);
      errors++;
    }

    // Write sections
    for (const section of themeFiles.sections) {
      try {
        await templateService.writeTemplateFile(template.slug, section.path, section.content);
        filesWritten++;
      } catch (e: any) {
        console.log(`  ✗ ${section.path}: ${e.message}`);
        errors++;
      }
    }

    // Write templates
    for (const t of themeFiles.templates) {
      try {
        await templateService.writeTemplateFile(template.slug, t.path, t.content);
        filesWritten++;
      } catch (e: any) {
        console.log(`  ✗ ${t.path}: ${e.message}`);
        errors++;
      }
    }

    // Write assets
    for (const asset of themeFiles.assets) {
      try {
        await templateService.writeTemplateFile(template.slug, asset.path, asset.content);
        filesWritten++;
      } catch (e: any) {
        console.log(`  ✗ ${asset.path}: ${e.message}`);
        errors++;
      }
    }

    // Write config
    for (const config of themeFiles.config) {
      try {
        await templateService.writeTemplateFile(template.slug, config.path, config.content);
        filesWritten++;
      } catch (e: any) {
        console.log(`  ✗ ${config.path}: ${e.message}`);
        errors++;
      }
    }

    console.log(`\n✅ Theme generation test complete!`);
    console.log(`   Files written: ${filesWritten}`);
    console.log(`   Errors: ${errors}`);
    console.log(`\n   Template ID: ${template._id}`);
    console.log(`   Template Slug: ${template.slug}`);
    console.log(`\n   Next step: Apply this template to a store via the dashboard.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testThemeGeneration();

