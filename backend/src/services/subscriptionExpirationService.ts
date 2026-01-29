import cron from 'node-cron';
import { Subscription } from '../models/Subscription';
import { User } from '../models/User';
import { plans } from '../config/plans';
import { createNotification } from '../utils/notifications';

/**
 * Background service to expire trials that ended without payment
 * Runs hourly to check for expired trials
 */
export class SubscriptionExpirationService {
  private static cronJob: ReturnType<typeof cron.schedule> | null = null;

  /**
   * Start the subscription expiration service
   * Runs every hour at minute 0
   */
  static start() {
    if (this.cronJob) {
      console.log('⏰ Subscription expiration service is already running');
      return;
    }

    // Schedule: Every hour at minute 0
    // Format: second minute hour day-of-month month day-of-week
    this.cronJob = cron.schedule('0 * * * *', async () => {
      await this.checkExpiredTrials();
    });

    console.log('✅ Subscription expiration service started (runs every hour)');
  }

  /**
   * Stop the subscription expiration service
   */
  static stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('⏹️ Subscription expiration service stopped');
    }
  }

  /**
   * Check and expire trials that ended without payment
   */
  static async checkExpiredTrials(): Promise<void> {
    const now = new Date();
    console.log(`🔄 Checking for expired trials at ${now.toISOString()}`);

    try {
      // Find all trialing subscriptions where trialEndsAt has passed
      const expiredTrials = await Subscription.find({
        status: 'trialing',
        trialEndsAt: { $lte: now },
      });

      if (expiredTrials.length === 0) {
        console.log('✅ No expired trials found');
        return;
      }

      console.log(`📋 Found ${expiredTrials.length} expired trial(s) to process`);

      let processed = 0;
      for (const subscription of expiredTrials) {
        try {
          const plan = plans[subscription.planCode];
          
          // Mark subscription as expired
          subscription.status = 'expired';
          subscription.history.push({
            action: 'trial_ended',
            timestamp: now,
            notes: `Trial expired without payment - subscription cancelled. Full amount (₹${plan.price / 100}) was not charged.`,
          });
          await subscription.save();

          // Revoke user access
          const user = await User.findById(subscription.userId);
          if (user && user.plan === subscription.planCode) {
            user.plan = null;
            user.planExpiresAt = null;
            user.isLifetime = false;
            await user.save();

            // Create notification
            await createNotification({
              userId: subscription.userId,
              type: 'system_update',
              title: 'Trial Expired',
              message: `Your ${plan.name} trial has expired. Full amount (₹${plan.price / 100}) was not charged. Please purchase a plan to continue.`,
              link: '/dashboard/billing',
              metadata: {
                planCode: subscription.planCode,
                planName: plan.name,
                subscriptionId: String(subscription._id),
              },
            });
          }

          processed++;
        } catch (error) {
          console.error(`❌ Failed to expire trial ${subscription._id}:`, error);
        }
      }

      console.log(`✅ Processed ${processed}/${expiredTrials.length} expired trial(s)`);
    } catch (error) {
      console.error('❌ Subscription expiration check failed:', error);
    }
  }

  /**
   * Run expiration check immediately (for testing or manual trigger)
   */
  static async runNow(): Promise<void> {
    await this.checkExpiredTrials();
  }
}
