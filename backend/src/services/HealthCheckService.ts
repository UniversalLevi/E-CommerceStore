import cron from 'node-cron';
import { Store } from '../models/Store';
import { AuditLog } from '../models/AuditLog';

/**
 * Background health check service
 * Runs weekly to check all internal stores
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
    inactive: number;
    suspended: number;
  }> {
    if (this.isRunning) {
      console.log('⏳ Health check already in progress, skipping...');
      return { total: 0, active: 0, inactive: 0, suspended: 0 };
    }

    this.isRunning = true;
    console.log('\n🏥 Starting store health check...');

    try {
      const stores = await Store.find({});
      console.log(`📊 Found ${stores.length} stores to check`);

      let activeCount = 0;
      let inactiveCount = 0;
      let suspendedCount = 0;

      for (const store of stores) {
        try {
          console.log(`\n🔍 Checking: ${store.name} (${store.slug})`);

          // Internal stores don't need connection testing
          // Just log the status
          if (store.status === 'active') {
            activeCount++;
            console.log(`  ✅ Active`);
          } else if (store.status === 'inactive') {
            inactiveCount++;
            console.log(`  ⚠️ Inactive`);
          } else if (store.status === 'suspended') {
            suspendedCount++;
            console.log(`  ❌ Suspended`);
          }

          // Log the check
          await AuditLog.create({
            userId: store.owner,
            storeId: store._id,
            action: 'AUTO_HEALTH_CHECK',
            success: true,
            details: {
              status: store.status,
            },
          });
        } catch (error: any) {
          console.error(`  ❌ Error checking ${store.name}:`, error.message);

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
      console.log(`   ⚠️ Inactive: ${inactiveCount}`);
      console.log(`   ❌ Suspended: ${suspendedCount}\n`);

      return {
        total: stores.length,
        active: activeCount,
        inactive: inactiveCount,
        suspended: suspendedCount,
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



