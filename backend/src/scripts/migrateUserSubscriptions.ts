import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { config } from '../config/env';
import { User } from '../models/User';

dotenv.config();

async function migrateUserSubscriptions() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to database');

    console.log('🔄 Migrating user subscriptions...');

    // Update all users to add subscription fields
    const result = await User.updateMany(
      {},
      {
        $set: {
          plan: null,
          planExpiresAt: null,
          isLifetime: false,
          productsAdded: 0,
        },
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users with subscription fields`);
    console.log('✅ Migration completed successfully');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrateUserSubscriptions();

