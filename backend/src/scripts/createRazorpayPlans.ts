import { connectDatabase } from '../config/database';
import { razorpayService } from '../services/RazorpayService';
import dotenv from 'dotenv';

dotenv.config();

/**
 * One-time script to create Razorpay plans via API
 * Run: npm run create-razorpay-plans
 * 
 * This creates the plans in Razorpay and outputs the plan IDs
 * which should be added to .env file
 */
async function createRazorpayPlans() {
  try {
    console.log('\n🚀 Creating Razorpay Plans...\n');

    // Connect to database (required for service initialization)
    await connectDatabase();

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Monthly Plan: ₹999/month after 30-day trial
    console.log('Creating Monthly Plan (₹999/month, 30-day trial)...');
    const monthlyPlan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: 'Monthly Plan',
        amount: 99900, // ₹999 in paise
        currency: 'INR',
        description: '₹999/month after 30-day free trial',
      },
    });
    console.log(`✅ Monthly Plan created: ${monthlyPlan.id}`);
    console.log(`   Add to .env: RAZORPAY_PLAN_MONTHLY_ID=${monthlyPlan.id}\n`);

    // Pro Plan: ₹4999 one-time after 7-day trial
    console.log('Creating Pro Plan (₹4999 one-time, 7-day trial)...');
    const proPlan = await razorpay.plans.create({
      period: 'yearly', // Required even for one-time
      interval: 1,
      item: {
        name: 'Pro Plan',
        amount: 499900, // ₹4999 in paise
        currency: 'INR',
        description: '₹4999 one-time after 7-day free trial',
      },
    });
    console.log(`✅ Pro Plan created: ${proPlan.id}`);
    console.log(`   Add to .env: RAZORPAY_PLAN_PRO_ID=${proPlan.id}\n`);

    // Lifetime Plan: ₹9999 one-time after 7-day trial
    console.log('Creating Lifetime Plan (₹9999 one-time, 7-day trial)...');
    const lifetimePlan = await razorpay.plans.create({
      period: 'yearly', // Required even for one-time
      interval: 1,
      item: {
        name: 'Lifetime Plan',
        amount: 999900, // ₹9999 in paise
        currency: 'INR',
        description: '₹9999 one-time after 7-day free trial',
      },
    });
    console.log(`✅ Lifetime Plan created: ${lifetimePlan.id}`);
    console.log(`   Add to .env: RAZORPAY_PLAN_LIFETIME_ID=${lifetimePlan.id}\n`);

    // Token Charge Plan: ₹20 one-time for UPI autopay mandate consent
    console.log('Creating Token Charge Plan (₹20 one-time for UPI autopay mandate)...');
    const TOKEN_CHARGE_AMOUNT = 2000; // ₹20 in paise
    const tokenPlan = await razorpay.plans.create({
      period: 'yearly', // Required even for one-time
      interval: 1,
      item: {
        name: 'Token Charge Plan',
        amount: TOKEN_CHARGE_AMOUNT, // ₹20 in paise
        currency: 'INR',
        description: '₹20 token charge for UPI autopay mandate consent',
      },
    });
    
    // Verify the created plan has the correct amount
    const createdPlan = await razorpay.plans.fetch(tokenPlan.id);
    const actualAmount = createdPlan.item.amount;
    
    if (actualAmount !== TOKEN_CHARGE_AMOUNT) {
      console.error(`❌ ERROR: Token plan amount mismatch!`);
      console.error(`   Expected: ₹${TOKEN_CHARGE_AMOUNT / 100} (${TOKEN_CHARGE_AMOUNT} paise)`);
      console.error(`   Actual: ₹${actualAmount / 100} (${actualAmount} paise)`);
      console.error(`   This plan should be deleted and recreated with the correct amount.`);
      throw new Error(`Token plan created with incorrect amount. Expected ₹${TOKEN_CHARGE_AMOUNT / 100}, got ₹${actualAmount / 100}`);
    }
    
    console.log(`✅ Token Charge Plan created: ${tokenPlan.id}`);
    console.log(`   Amount verified: ₹${actualAmount / 100} (${actualAmount} paise) - Correct!`);
    console.log(`   Add to .env: RAZORPAY_PLAN_TOKEN_ID=${tokenPlan.id}\n`);

    console.log('\n📋 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Add these to your .env file:');
    console.log(`RAZORPAY_PLAN_MONTHLY_ID=${monthlyPlan.id}`);
    console.log(`RAZORPAY_PLAN_PRO_ID=${proPlan.id}`);
    console.log(`RAZORPAY_PLAN_LIFETIME_ID=${lifetimePlan.id}`);
    console.log(`RAZORPAY_PLAN_TOKEN_ID=${tokenPlan.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error creating Razorpay plans:', error);
    if (error.error) {
      console.error('Razorpay error:', error.error);
    }
    process.exit(1);
  }
}

createRazorpayPlans();
