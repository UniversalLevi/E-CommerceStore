/**
 * Seed Script: Create White and Black templates in the database
 * Run with: npx ts-node src/scripts/seedTemplates.ts
 */

import mongoose from 'mongoose';
import { config } from '../config/env';
import { Template } from '../models/Template';
import { User } from '../models/User';

async function seedTemplates() {
  try {
    console.log('🌱 Connecting to database...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find an admin user to set as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    const templates = [
      {
        name: 'White Clean Theme',
        slug: 'white',
        description: 'A bright and clean white theme perfect for showcasing products with elegance and clarity',
        category: 'minimal',
        previewImage: '',
      },
      {
        name: 'Black Premium Theme',
        slug: 'black',
        description: 'A sleek dark theme with premium aesthetics, perfect for luxury brands and modern stores',
        category: 'luxury',
        previewImage: '',
      },
    ];

    for (const templateData of templates) {
      const existing = await Template.findOne({ slug: templateData.slug });
      if (existing) {
        console.log(`⚠️  ${templateData.name} already exists. Updating...`);
        existing.name = templateData.name;
        existing.description = templateData.description;
        existing.category = templateData.category as any;
        existing.isActive = true;
        existing.isDeleted = false;
        await existing.save();
        console.log(`✅ ${templateData.name} updated successfully`);
      } else {
        const template = await Template.create({
          ...templateData,
          category: templateData.category as any,
          isActive: true,
          isDeleted: false,
          createdBy: adminUser._id,
          appliedCount: 0,
          metadata: {
            version: '1.0.0',
          },
        });
        console.log(`✅ ${templateData.name} created successfully`);
        console.log('   ID:', template._id);
        console.log('   Slug:', template.slug);
      }
    }

    await mongoose.disconnect();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedTemplates();

