import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { ConnectedStore } from '../models/ConnectedStore';
import { CredentialService } from '../services/CredentialService';
import crypto from 'crypto';

/**
 * Migration script to move legacy Shopify credentials from User model to ConnectedStore
 * 
 * Usage: npm run migrate-legacy
 */
async function migrateLegacyStores() {
  try {
    console.log('🔄 Starting legacy store migration...\n');

    await connectDatabase();

    // Find all users with legacy Shopify credentials
    const users = await User.find({
      shopifyAccessToken: { $exists: true, $ne: null },
      shopifyShop: { $exists: true, $ne: null },
    });

    console.log(`Found ${users.length} users with legacy Shopify credentials\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        console.log(`Processing user: ${user.email}`);

        // Check if this store already exists in ConnectedStore
        const existingStore = await ConnectedStore.findOne({
          userId: user._id,
          storeDomain: user.shopifyShop,
          platform: 'shopify',
        });

        if (existingStore) {
          console.log(`  ⏭️  Store already migrated, skipping...\n`);
          skipped++;
          continue;
        }

        // Encrypt the legacy access token
        const encryptedToken = CredentialService.encrypt(user.shopifyAccessToken!);
        const webhookSecret = crypto.randomBytes(32).toString('hex');
        const hmacSecret = process.env.SHOPIFY_API_SECRET || crypto.randomBytes(32).toString('hex');

        // Create new ConnectedStore record
        const store = await ConnectedStore.create({
          userId: user._id,
          storeName: user.shopifyShop!.replace('.myshopify.com', ''),
          platform: 'shopify',
          storeDomain: user.shopifyShop,
          encryptedCredentials: encryptedToken,
          encryptionVersion: 1,
          oauthMetadata: {
            scopes: ['read_products', 'write_products', 'read_orders', 'write_orders'],
            tokenType: 'legacy',
          },
          webhookSecret,
          hmacSecret,
          status: 'connected',
          platformMetadata: {
            migratedFromLegacy: true,
            migrationDate: new Date(),
          },
        });

        // Add to user's connectedStores array
        await User.findByIdAndUpdate(user._id, {
          $addToSet: { connectedStores: store._id },
        });

        console.log(`  ✅ Migrated store: ${store.storeDomain}`);
        console.log(`     Store ID: ${store._id}\n`);
        
        migrated++;
      } catch (error: any) {
        console.error(`  ❌ Error migrating user ${user.email}:`, error.message, '\n');
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📝 Total processed: ${users.length}\n`);

    if (migrated > 0) {
      console.log('⚠️  Note: Legacy credentials (shopifyAccessToken, shopifyShop) are still present in User model');
      console.log('   for backward compatibility. They will be deprecated in a future release.\n');
    }

    console.log('✅ Migration completed!\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
migrateLegacyStores();

