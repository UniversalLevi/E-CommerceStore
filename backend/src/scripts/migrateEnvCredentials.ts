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

    // Find or create admin user
    let adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      console.log('⚠️  No admin user found. Please specify admin email:');
      console.log('   Or create one first using: npm run create-admin\n');
      process.exit(1);
    }

    console.log(`Using admin user: ${adminUser.email}`);

    // Check if store already exists
    const existingStore = await StoreConnection.findOne({
      owner: adminUser._id,
      shopDomain: shopDomain,
    });

    if (existingStore) {
      console.log(`\n⏭️  Store already migrated: ${existingStore.storeName}`);
      console.log(`   Store ID: ${existingStore._id}`);
      console.log(`   Status: ${existingStore.status}`);
      console.log(`   Default: ${existingStore.isDefault}\n`);
      console.log('✅ Migration already complete!\n');
      process.exit(0);
    }

    // Encrypt the access token
    console.log('\n🔐 Encrypting credentials...');
    const encryptedToken = encrypt(accessToken);

    // Legacy Shopify migration - no longer supported

    const store = await StoreConnection.create({
      owner: adminUser._id,
      storeName: 'Legacy Store',
      shopDomain,
      accessToken: encryptedToken,
      scopes,
      environment: 'production',
      isDefault: true,
      status: 'active',
      metadata: {
        migratedFromEnv: true,
        migrationDate: new Date(),
      },
    });

    console.log('✅ Store connection created successfully!\n');
    console.log('📋 Migration Details:');
    console.log(`   Store Name: ${store.storeName}`);
    console.log(`   Shop Domain: ${store.shopDomain}`);
    console.log(`   Store ID: ${store._id}`);
    console.log(`   Owner: ${adminUser.email}`);
    console.log(`   Environment: ${store.environment}`);
    console.log(`   Default: ${store.isDefault}`);
    console.log(`   Scopes: ${store.scopes.join(', ')}\n`);

    console.log('✅ Migration completed successfully!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Test the store connection via /api/stores/:id/test');
    console.log('   2. Create products using the new store ID');
    console.log('   3. (Optional) Remove SHOPIFY_SHOP and SHOPIFY_ACCESS_TOKEN from .env\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrateEnvCredentials();



