/**
 * Niche Seeder
 * Run this script to populate your database with default niches
 * 
 * Usage: npx ts-node src/scripts/seedNiches.ts
 * Or: npm run seed:niches
 */

import mongoose from 'mongoose';
import { Niche } from '../models/Niche';
import { config } from '../config/env';
import { connectDatabase } from '../config/database';

const defaultNiches = [
  {
    name: 'Uncategorized',
    slug: 'uncategorized',
    description: 'Products that have not been assigned to a specific niche',
    richDescription: '<p>Default category for products without a specific niche assignment.</p>',
    icon: '📦',
    order: 0,
    priority: 0,
    featured: false,
    showOnHomePage: false,
    isDefault: true, // CRITICAL: This is the default niche
    active: true,
    synonyms: ['misc', 'other', 'general'],
    metaTitle: 'Uncategorized Products',
    metaDescription: 'Browse products that have not been assigned to a specific niche',
    defaultSortMode: 'newest',
  },
  {
    name: 'Fitness & Health',
    slug: 'fitness-health',
    description: 'Exercise equipment, supplements, and wellness products',
    richDescription: '<h2>Fitness & Health</h2><p>Discover the best fitness equipment, supplements, and wellness products to help you achieve your health goals.</p>',
    icon: '💪',
    order: 1,
    priority: 10,
    featured: true,
    showOnHomePage: true,
    isDefault: false,
    active: true,
    synonyms: ['fitness gear', 'gym', 'wellness', 'exercise', 'workout'],
    metaTitle: 'Fitness & Health Products',
    metaDescription: 'Shop the best fitness equipment, supplements, and wellness products',
    themeColor: '#FF6B6B',
    textColor: '#FFFFFF',
    defaultSortMode: 'popularity',
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Furniture, decor, tools, and outdoor products',
    richDescription: '<h2>Home & Garden</h2><p>Transform your living space with our curated selection of furniture, decor, and garden essentials.</p>',
    icon: '🏠',
    order: 2,
    priority: 9,
    featured: true,
    showOnHomePage: true,
    isDefault: false,
    active: true,
    synonyms: ['furniture', 'decor', 'garden tools', 'outdoor', 'home improvement'],
    metaTitle: 'Home & Garden Products',
    metaDescription: 'Shop furniture, decor, tools, and outdoor products for your home',
    themeColor: '#4ECDC4',
    textColor: '#FFFFFF',
    defaultSortMode: 'newest',
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Gadgets, accessories, and tech products',
    richDescription: '<h2>Electronics</h2><p>Stay connected with the latest gadgets, accessories, and tech products.</p>',
    icon: '📱',
    order: 3,
    priority: 8,
    featured: true,
    showOnHomePage: true,
    isDefault: false,
    active: true,
    synonyms: ['gadgets', 'tech', 'devices', 'accessories', 'smartphones'],
    metaTitle: 'Electronics & Tech Products',
    metaDescription: 'Shop the latest electronics, gadgets, and tech accessories',
    themeColor: '#45B7D1',
    textColor: '#FFFFFF',
    defaultSortMode: 'newest',
  },
  {
    name: 'Fashion & Apparel',
    slug: 'fashion',
    description: 'Clothing, shoes, and accessories',
    icon: '👕',
    order: 4,
    priority: 7,
    featured: false,
    showOnHomePage: true,
    isDefault: false,
    active: true,
    synonyms: ['clothing', 'apparel', 'fashion', 'style', 'wardrobe'],
    defaultSortMode: 'newest',
  },
  {
    name: 'Beauty & Personal Care',
    slug: 'beauty',
    description: 'Skincare, makeup, and grooming products',
    icon: '💄',
    order: 5,
    priority: 6,
    featured: false,
    showOnHomePage: true,
    isDefault: false,
    active: true,
    synonyms: ['skincare', 'makeup', 'cosmetics', 'grooming', 'beauty products'],
    defaultSortMode: 'popularity',
  },
  {
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    description: 'Athletic gear and outdoor recreation',
    icon: '⚽',
    order: 6,
    priority: 5,
    featured: false,
    showOnHomePage: false,
    isDefault: false,
    active: true,
    synonyms: ['sports', 'athletic', 'outdoor', 'recreation', 'fitness'],
    defaultSortMode: 'newest',
  },
  {
    name: 'Toys & Games',
    slug: 'toys-games',
    description: 'Entertainment and educational products',
    icon: '🎮',
    order: 7,
    priority: 4,
    featured: false,
    showOnHomePage: false,
    isDefault: false,
    active: true,
    synonyms: ['toys', 'games', 'entertainment', 'educational', 'play'],
    defaultSortMode: 'newest',
  },
];

async function seedNiches() {
  try {
    console.log('🌱 Starting niche seeding...');
    
    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database');

    // Ensure "Uncategorized" exists first
    const defaultNiche = await Niche.findOne({ isDefault: true });
    if (!defaultNiche) {
      const uncategorized = defaultNiches.find((n) => n.isDefault);
      if (uncategorized) {
        await Niche.create(uncategorized);
        console.log(`✅ Created default niche: ${uncategorized.name}`);
      }
    } else {
      console.log(`ℹ️  Default niche already exists: ${defaultNiche.name}`);
    }

    // Process each niche
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const nicheData of defaultNiches) {
      const existing = await Niche.findOne({
        slug: nicheData.slug.toLowerCase(),
      });

      if (existing) {
        // Update if needed (idempotent)
        let needsUpdate = false;
        const updates: any = {};

        // Check if any important fields differ
        if (existing.name !== nicheData.name) {
          updates.name = nicheData.name;
          needsUpdate = true;
        }
        if (existing.description !== nicheData.description) {
          updates.description = nicheData.description;
          needsUpdate = true;
        }
        if (existing.isDefault !== nicheData.isDefault) {
          updates.isDefault = nicheData.isDefault;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await Niche.findByIdAndUpdate(existing._id, updates);
          updated++;
          console.log(`🔄 Updated niche: ${nicheData.name}`);
        } else {
          skipped++;
          console.log(`⏭️  Skipped (already exists): ${nicheData.name}`);
        }
      } else {
        await Niche.create(nicheData);
        created++;
        console.log(`✅ Created niche: ${nicheData.name}`);
      }
    }

    // Verify at least one active niche exists
    const activeCount = await Niche.countDocuments({ active: true, deleted: false });
    if (activeCount === 0) {
      console.log('⚠️  Warning: No active niches found. Creating default...');
      const defaultNiche = await Niche.findOne({ isDefault: true });
      if (defaultNiche) {
        defaultNiche.active = true;
        await defaultNiche.save();
        console.log('✅ Activated default niche');
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total Active: ${activeCount}`);
    console.log('\n✅ Niche seeding completed successfully!');

    // Close database connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding niches:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedNiches();
}

export default seedNiches;






