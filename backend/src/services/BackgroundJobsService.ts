import * as cron from 'node-cron';
import { ConnectedStore } from '../models/ConnectedStore';
import { TokenRefreshService } from './TokenRefreshService';
import { AuditLogService } from './AuditLogService';

/**
 * Background jobs service using node-cron
 * Runs periodic tasks like checking token expiry, cleaning up old data, etc.
 */
export class BackgroundJobsService {
  private static tasks: cron.ScheduledTask[] = [];

  /**
   * Start all background jobs
   */
  static start() {
    console.log('🔄 Starting background jobs...');

    // Check for expiring tokens every hour
    this.tasks.push(
      cron.schedule('0 * * * *', async () => {
        console.log('⏰ Running token expiry check...');
        await this.checkExpiringTokens();
      })
    );

    // Clean up old audit logs every day at midnight
    this.tasks.push(
      cron.schedule('0 0 * * *', async () => {
        console.log('⏰ Running audit log cleanup...');
        await this.cleanupOldAuditLogs();
      })
    );

    // Check store health every 6 hours
    this.tasks.push(
      cron.schedule('0 */6 * * *', async () => {
        console.log('⏰ Running store health check...');
        await this.checkStoreHealth();
      })
    );

    console.log(`✅ ${this.tasks.length} background jobs started`);
  }

  /**
   * Stop all background jobs
   */
  static stop() {
    console.log('🛑 Stopping background jobs...');
    this.tasks.forEach(task => task.stop());
    this.tasks = [];
  }

  /**
   * Check for tokens that will expire soon and alert
   */
  private static async checkExpiringTokens() {
    try {
      const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const expiringStores = await ConnectedStore.find({
        status: 'connected',
        tokenExpiresAt: {
          $gte: new Date(),
          $lte: oneWeekFromNow,
        },
      }).populate('userId', 'email');

      console.log(`Found ${expiringStores.length} stores with expiring tokens`);

      for (const store of expiringStores) {
        await AuditLogService.log({
          storeId: String(store._id),
          userId: String(store.userId),
          action: 'token_expiring_soon',
          metadata: {
            expiresAt: store.tokenExpiresAt,
            daysRemaining: Math.ceil(
              (store.tokenExpiresAt!.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
            ),
          },
        });

        // TODO: Send email notification to user
        console.log(`⚠️  Token expiring soon for store: ${store.storeDomain}`);
      }
    } catch (error) {
      console.error('Error checking expiring tokens:', error);
    }
  }

  /**
   * Clean up audit logs older than 90 days
   */
  private static async cleanupOldAuditLogs() {
    try {
      const { AuditLog } = await import('../models/AuditLog');
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const result = await AuditLog.deleteMany({
        timestamp: { $lt: ninetyDaysAgo },
      });

      console.log(`🗑️  Cleaned up ${result.deletedCount} old audit logs`);
    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
    }
  }

  /**
   * Check health of connected stores
   */
  private static async checkStoreHealth() {
    try {
      const activeStores = await ConnectedStore.find({
        status: 'connected',
      });

      console.log(`Checking health of ${activeStores.length} stores`);

      let healthyCount = 0;
      let unhealthyCount = 0;

      for (const store of activeStores) {
        try {
          const isValid = await TokenRefreshService.validateToken(
            String(store._id)
          );

          if (!isValid) {
            unhealthyCount++;
            
            // Update store status
            store.status = 'expired';
            await store.save();

            await AuditLogService.log({
              storeId: String(store._id),
              userId: String(store.userId),
              action: 'token_expired',
              metadata: {
                reason: 'Health check failed',
              },
            });

            console.log(`❌ Store unhealthy: ${store.storeDomain}`);
          } else {
            healthyCount++;
          }
        } catch (error) {
          unhealthyCount++;
          console.error(`Error checking store ${store.storeDomain}:`, error);
        }
      }

      console.log(
        `Health check complete: ${healthyCount} healthy, ${unhealthyCount} unhealthy`
      );
    } catch (error) {
      console.error('Error during health check:', error);
    }
  }

  /**
   * Run a one-off job manually (for testing or admin tasks)
   */
  static async runJob(jobName: string) {
    console.log(`▶️  Running job: ${jobName}`);

    switch (jobName) {
      case 'checkExpiringTokens':
        await this.checkExpiringTokens();
        break;
      case 'cleanupAuditLogs':
        await this.cleanupOldAuditLogs();
        break;
      case 'checkStoreHealth':
        await this.checkStoreHealth();
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }

    console.log(`✅ Job completed: ${jobName}`);
  }
}

