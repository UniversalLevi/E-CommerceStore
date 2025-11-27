import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { config } from '../config/env';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { Payment } from '../models/Payment';
import { plans } from '../config/plans';

dotenv.config();

async function migrateSubscriptions() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to database');

    console.log('🔄 Migrating user subscriptions to Subscription model...');

    // Find all users with active subscriptions
    const usersWithPlans = await User.find({
      plan: { $ne: null },
    }).lean();

    console.log(`📊 Found ${usersWithPlans.length} users with plans`);

    let created = 0;
    let skipped = 0;

    for (const user of usersWithPlans) {
      try {
        // Check if subscription already exists
        const existingSub = await Subscription.findOne({
          userId: user._id,
          status: { $in: ['active', 'manually_granted'] },
        });

        if (existingSub) {
          console.log(`⏭️  Skipping user ${user.email} - subscription already exists`);
          skipped++;
          continue;
        }

        const planCode = user.plan as keyof typeof plans;
        if (!planCode || !plans[planCode]) {
          console.log(`⚠️  Skipping user ${user.email} - invalid plan code: ${user.plan}`);
          skipped++;
          continue;
        }

        const plan = plans[planCode];
        const now = new Date();

        // Determine source - check if there's a payment record
        const payment = await Payment.findOne({
          userId: user._id,
          planCode: planCode,
          status: 'paid',
        }).sort({ createdAt: -1 });

        const source = payment ? 'razorpay' : 'manual';

        // Create subscription record
        const subscription = await Subscription.create({
          userId: user._id,
          planCode: planCode,
          status: user.isLifetime ? 'active' : (user.planExpiresAt && user.planExpiresAt > now ? 'active' : 'expired'),
          startDate: payment?.createdAt || user.createdAt || now,
          endDate: user.isLifetime ? null : user.planExpiresAt,
          amountPaid: plan.price,
          source: source,
          razorpayPaymentId: payment?.paymentId,
          history: [
            {
              action: source === 'razorpay' ? 'subscription_activated' : 'manual_granted',
              timestamp: payment?.createdAt || user.createdAt || now,
              notes: source === 'razorpay' 
                ? 'Migrated from existing payment record'
                : 'Migrated from existing user subscription (source unknown)',
            },
          ],
        });

        // Link payment to subscription if found
        if (payment) {
          payment.subscriptionId = subscription._id as mongoose.Types.ObjectId;
          payment.planName = plan.name;
          await payment.save();
        }

        console.log(`✅ Created subscription for user ${user.email} (${planCode})`);
        created++;
      } catch (error: any) {
        console.error(`❌ Error migrating user ${user.email}:`, error.message);
        skipped++;
      }
    }

    console.log(`\n✅ Migration completed:`);
    console.log(`   - Created: ${created} subscriptions`);
    console.log(`   - Skipped: ${skipped} users`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrateSubscriptions();

