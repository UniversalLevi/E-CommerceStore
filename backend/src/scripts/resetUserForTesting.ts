import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { config } from '../config/env';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';

dotenv.config();

/**
 * Reset a user's subscription status for testing affiliate system
 * Usage: npm run reset-user-for-testing -- <userEmail>
 */
async function resetUserForTesting() {
  try {
    const userEmail = process.argv[2];

    if (!userEmail) {
      console.error('❌ Please provide a user email: npm run reset-user-for-testing -- <userEmail>');
      process.exit(1);
    }

    console.log('🔄 Connecting to database...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to database');

    console.log(`🔄 Finding user: ${userEmail}...`);
    const user = await User.findOne({ email: userEmail.toLowerCase() });

    if (!user) {
      console.error(`❌ User not found: ${userEmail}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);

    // Reset user subscription fields
    console.log('🔄 Resetting user subscription fields...');
    user.hasUsedTrial = false;
    user.plan = null;
    user.planExpiresAt = null;
    user.isLifetime = false;
    user.productsAdded = 0;
    await user.save();
    console.log('✅ User subscription fields reset');

    // Cancel/delete existing subscriptions
    console.log('🔄 Cancelling existing subscriptions...');
    const result = await Subscription.updateMany(
      { userId: user._id, status: { $in: ['active', 'trialing', 'manually_granted'] } },
      { status: 'cancelled' }
    );
    console.log(`✅ Cancelled ${result.modifiedCount} subscription(s)`);

    console.log('\n✅ User reset complete!');
    console.log('📝 User can now:');
    console.log('   - Create a new trial subscription');
    console.log('   - Test the affiliate system');
    console.log('   - Register with a referral code');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

resetUserForTesting();
