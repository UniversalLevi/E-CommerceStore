import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { StoreConnection } from '../models/StoreConnection';
import { encrypt } from '../utils/encryption';
import { config } from '../config/env';
import crypto from 'crypto';

/**
 * Migration script to move legacy env-stored credentials to database
 * Run: npm run migrate-env
 */
async function migrateEnvCredentials() {
  try {
    console.log('\n🔄 Starting credential migration from .env to database...\n');

    // Connect to database
    await connectDatabase();

    // Legacy Shopify migration - no longer supported
    console.log('❌ This migration script is deprecated.');
    console.log('   Shopify integration has been removed. Use internal stores instead.\n');
    process.exit(1);
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrateEnvCredentials();



