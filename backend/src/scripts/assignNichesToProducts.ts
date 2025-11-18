/**
 * Migration Script: Assign Niches to Products
 * Run this script to assign existing products to niches
 * 
 * Usage: npx ts-node src/scripts/assignNichesToProducts.ts
 * Or: npm run migrate:niches
 */

import mongoose from 'mongoose';
import { Niche } from '../models/Niche';
import { Product } from '../models/Product';
import { config } from '../config/env';
import { connectDatabase } from '../config/database';
import { updateNicheProductCounts } from '../controllers/nicheController';

// Optional: Map old categories to new niches
const categoryMapping: Record<string, string> = {
  'fitness': 'fitness-health',
  'health': 'fitness-health',
  'home': 'home-garden',
  'garden': 'home-garden',
  'electronics': 'electronics',
  'tech': 'electronics',
  'fashion': 'fashion',
  'clothing': 'fashion',
  'beauty': 'beauty',
  'skincare': 'beauty',
  'sports': 'sports-outdoors',
  'outdoors': 'sports-outdoors',
  'toys': 'toys-games',
  'games': 'toys-games',
};

async function assignNichesToProducts() {
  try {
    console.log('🔄 Starting product-to-niche migration...');
    
    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database');

    // Find or create "Uncategorized" niche
    let uncategorizedNiche = await Niche.findOne({ isDefault: true });
    if (!uncategorizedNiche) {
      console.log('⚠️  Default niche not found. Creating...');
      uncategorizedNiche = await Niche.create({
        name: 'Uncategorized',
        slug: 'uncategorized',
        description: 'Products that have not been assigned to a specific niche',
        isDefault: true,
        active: true,
        order: 0,
        priority: 0,
        featured: false,
        showOnHomePage: false,
        defaultSortMode: 'newest',
      });
      console.log('✅ Created default niche: Uncategorized');
    } else {
      console.log(`✅ Found default niche: ${uncategorizedNiche.name}`);
    }

    // Find all products without niche
    const productsWithoutNiche = await Product.find({
      $or: [
        { niche: { $exists: false } },
        { niche: null },
      ],
    });

    console.log(`\n📦 Found ${productsWithoutNiche.length} products without niche`);

    if (productsWithoutNiche.length === 0) {
      console.log('✅ All products already have niches assigned!');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Track assignments
    const assignments: Record<string, number> = {};
    const affectedNicheIds = new Set<string>();

    // Process each product
    for (const product of productsWithoutNiche) {
      let targetNicheId: mongoose.Types.ObjectId = uncategorizedNiche._id as mongoose.Types.ObjectId;
      let assignedTo = 'uncategorized';

      // Try to map by category
      if (product.category) {
        const categoryLower = product.category.toLowerCase();
        const mappedSlug = categoryMapping[categoryLower];
        
        if (mappedSlug) {
          const mappedNiche = await Niche.findOne({
            slug: mappedSlug,
            deleted: false,
          });
          
          if (mappedNiche) {
            targetNicheId = mappedNiche._id as mongoose.Types.ObjectId;
            assignedTo = mappedSlug;
          }
        }
      }

      // Assign niche
      product.niche = targetNicheId;
      await product.save();

      // Track assignment
      assignments[assignedTo] = (assignments[assignedTo] || 0) + 1;
      affectedNicheIds.add(targetNicheId.toString());
    }

    // Update product counts for all affected niches
    console.log('\n🔄 Updating product counts...');
    for (const nicheId of Array.from(affectedNicheIds)) {
      await updateNicheProductCounts(nicheId);
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   Total products processed: ${productsWithoutNiche.length}`);
    console.log('\n   Assignments by niche:');
    for (const [niche, count] of Object.entries(assignments)) {
      console.log(`     ${niche}: ${count} products`);
    }
    console.log(`\n   Niches updated: ${affectedNicheIds.size}`);

    // Verify all products have niche
    const remaining = await Product.countDocuments({
      $or: [
        { niche: { $exists: false } },
        { niche: null },
      ],
    });

    if (remaining > 0) {
      console.log(`\n⚠️  Warning: ${remaining} products still without niche`);
    } else {
      console.log('\n✅ All products have been assigned to niches!');
    }

    console.log('\n✅ Migration completed successfully!');

    // Close database connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  assignNichesToProducts();
}

export default assignNichesToProducts;




