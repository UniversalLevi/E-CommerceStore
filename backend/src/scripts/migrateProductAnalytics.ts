import mongoose from 'mongoose';
import { config } from '../config/env';
import { Product } from '../models/Product';

/**
 * Migration script to add default analytics to existing products
 * Run: npm run migrate:analytics
 */
async function migrateProductAnalytics() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('🔄 Migrating product analytics...');
    
    // Update all products that don't have analytics field
    const result = await Product.updateMany(
      {
        $or: [
          { analytics: { $exists: false } },
          { 'analytics.views': { $exists: false } },
          { 'analytics.imports': { $exists: false } },
          { 'analytics.conversions': { $exists: false } },
        ],
      },
      {
        $set: {
          'analytics.views': 0,
          'analytics.imports': 0,
          'analytics.conversions': 0,
        },
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} products with default analytics`);

    // Set default values for other optional fields
    const otherFieldsResult = await Product.updateMany(
      {
        $or: [
          { beginnerFriendly: { $exists: false } },
          { llmCacheVersion: { $exists: false } },
        ],
      },
      {
        $set: {
          beginnerFriendly: false,
          llmCacheVersion: 1,
        },
      }
    );

    console.log(`✅ Updated ${otherFieldsResult.modifiedCount} products with default optional fields`);

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateProductAnalytics();

