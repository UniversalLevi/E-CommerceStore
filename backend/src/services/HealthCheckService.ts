import cron from 'node-cron';
import { StoreConnection } from '../models/StoreConnection';
import { AuditLog } from '../models/AuditLog';
import { validateShopifyCredentials } from '../utils/shopify';
import { decrypt } from '../utils/encryption';

/**
 * Background health check service
 * Runs weekly to test all store connections
 */
export class HealthCheckService {
  private static cronJob: ReturnType<typeof cron.schedule> | null = null;
  private static isRunning = false;

  /**
   * Start the health check cron job
   * Runs every Sunday at 3:00 AM
   */
  static start() {
    if (this.cronJob) {
      console.log('⏰ Health check service is already running');
      return;
    }

    // Schedule: Every Sunday at 3:00 AM
    // Format: second minute hour day-of-month month day-of-week
    this.cronJob = cron.schedule('0 3 * * 0', async () => {
      await this.runHealthCheck();
    });

    console.log('✅ Health check service started (runs every Sunday at 3:00 AM)');
  }

  /**
   * Stop the health check cron job
   */
  static stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('⏹️ Health check service stopped');
    }
  }

  /**
   * Run health check immediately (for testing or manual trigger)
   */
  static async runHealthCheck(): Promise<{
    total: number;
    active: number;
    invalid: number;
    revoked: number;
  }> {
    if (this.isRunning) {
      console.log('⏳ Health check already in progress, skipping...');
      return { total: 0, active: 0, invalid: 0, revoked: 0 };
    }

    this.isRunning = true;
    console.log('\n🏥 Starting store health check...');

    try {
      const stores = await StoreConnection.find({ status: { $ne: 'revoked' } });
      console.log(`📊 Found ${stores.length} stores to check`);

      let activeCount = 0;
      let invalidCount = 0;
      let revokedCount = 0;
      let errorCount = 0;

      for (const store of stores) {
        try {
          console.log(`\n🔍 Checking: ${store.storeName} (${store.shopDomain})`);

          // Decrypt access token
          const accessToken = decrypt(store.accessToken);

          // Validate credentials
          const validation = await validateShopifyCredentials(
            store.shopDomain,
            accessToken,
            store.apiVersion
          );

          // Update store status
          store.lastTestedAt = new Date();

          if (validation.ok) {
            store.status = 'active';
            store.lastTestResult = 'success';
            activeCount++;
            console.log(`  ✅ Active`);
          } else {
            // Check if credentials are revoked or just invalid
            if (validation.statusCode === 401 || validation.statusCode === 403) {
              store.status = 'revoked';
              store.lastTestResult = validation.error || 'credentials revoked';
              revokedCount++;
              console.log(`  ❌ Revoked: ${validation.error}`);
            } else {
              store.status = 'invalid';
              store.lastTestResult = validation.error || 'validation failed';
              invalidCount++;
              console.log(`  ⚠️ Invalid: ${validation.error}`);
            }
          }

          // Save updated status
          await store.save();

          // Create audit log
          await AuditLog.create({
            userId: store.owner,
            storeId: store._id,
            action: 'AUTO_HEALTH_CHECK',
            success: validation.ok,
            errorMessage: validation.ok ? undefined : validation.error,
            details: {
              statusCode: validation.statusCode,
              previousStatus: store.status,
              newStatus: validation.ok ? 'active' : 'invalid',
            },
          });

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          console.error(`  ❌ Error checking ${store.storeName}:`, error.message);
          errorCount++;

          // Log the error
          await AuditLog.create({
            userId: store.owner,
            storeId: store._id,
            action: 'AUTO_HEALTH_CHECK',
            success: false,
            errorMessage: `Health check failed: ${error.message}`,
            details: {
              error: error.message,
            },
          });
        }
      }

      console.log('\n📈 Health check complete:');
      console.log(`   Total checked: ${stores.length}`);
      console.log(`   ✅ Active: ${activeCount}`);
      console.log(`   ⚠️ Invalid: ${invalidCount}`);
      console.log(`   ❌ Revoked: ${revokedCount}`);
      console.log(`   🚫 Errors: ${errorCount}\n`);

      return {
        total: stores.length,
        active: activeCount,
        invalid: invalidCount,
        revoked: revokedCount,
      };
    } catch (error: any) {
      console.error('❌ Health check failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get health check status
   */
  static getStatus(): { running: boolean; nextRun: string | null } {
    return {
      running: !!this.cronJob,
      nextRun: this.cronJob ? 'Every Sunday at 3:00 AM' : null,
    };
  }
}



