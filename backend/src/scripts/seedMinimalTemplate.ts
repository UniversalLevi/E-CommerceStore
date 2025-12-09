/**
 * Seed Script: Create the default Minimal template in the database
 * Run with: npx ts-node src/scripts/seedMinimalTemplate.ts
 */

import mongoose from 'mongoose';
import { config } from '../config/env';
import { Template } from '../models/Template';
import { User } from '../models/User';

async function seedMinimalTemplate() {
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

    // Check if template already exists
    const existing = await Template.findOne({ slug: 'minimal' });
    if (existing) {
      console.log('⚠️  Minimal template already exists. Updating...');
      existing.name = 'Minimal Clean Theme';
      existing.description = 'A clean and modern minimalist layout perfect for showcasing products with elegance and simplicity';
      existing.category = 'minimal';
      existing.isActive = true;
      existing.isDeleted = false;
      await existing.save();
      console.log('✅ Template updated successfully');
    } else {
      // Create the template
      const template = await Template.create({
        name: 'Minimal Clean Theme',
        slug: 'minimal',
        description: 'A clean and modern minimalist layout perfect for showcasing products with elegance and simplicity',
        previewImage: '',
        category: 'minimal',
        isActive: true,
        isDeleted: false,
        createdBy: adminUser._id,
        appliedCount: 0,
        metadata: {
          version: '1.0.0',
          features: [
            'Clean hero section',
            'Featured products grid',
            'Newsletter signup',
            'Custom footer',
            'Mobile responsive',
          ],
        },
      });

      console.log('✅ Minimal template created successfully');
      console.log('   ID:', template._id);
      console.log('   Name:', template.name);
      console.log('   Slug:', template.slug);
    }

    await mongoose.disconnect();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedMinimalTemplate();

