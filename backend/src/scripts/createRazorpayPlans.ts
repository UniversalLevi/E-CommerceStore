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

    // Monthly Plan: ₹999/month after 7-day trial
    console.log('Creating Monthly Plan (₹999/month, 7-day trial)...');
    const monthlyPlan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: 'Monthly Plan',
        amount: 99900, // ₹999 in paise
        currency: 'INR',
        description: '₹999/month after 7-day free trial',
      },
    });
    console.log(`✅ Monthly Plan created: ${monthlyPlan.id}`);
    console.log(`   Add to .env: RAZORPAY_PLAN_MONTHLY_ID=${monthlyPlan.id}\n`);

    // Pro Plan: ₹3999 for 5 months after 7-day trial
    console.log('Creating Pro Plan (₹3999 for 5 months, 7-day trial)...');
    const proPlan = await razorpay.plans.create({
      period: 'yearly', // Required even for fixed duration
      interval: 1,
      item: {
        name: 'Pro Plan',
        amount: 399900, // ₹3999 in paise
        currency: 'INR',
        description: '₹3999 for 5 months after 7-day free trial',
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

    // Eazy Stores - Grow Plan: ₹7000 for 3 months (₹20 first month is token charge, handled separately)
    console.log('Creating Eazy Stores Grow Plan (₹7000 for 3 months)...');
    const storesGrowPlan = await razorpay.plans.create({
      period: 'monthly',
      interval: 3,
      item: {
        name: 'Eazy Stores Grow Plan',
        amount: 700000, // ₹7000 in paise
        currency: 'INR',
        description: '₹7000 for 3 months (₹20 first month, then ₹7000 for 3 months)',
      },
    });
    console.log(`✅ Eazy Stores Grow Plan created: ${storesGrowPlan.id}`);
    console.log(`   Add to .env: RAZORPAY_PLAN_STORES_GROW_ID=${storesGrowPlan.id}\n`);

    // Eazy Stores - Advanced Plan: ₹30000 for 3 months
    console.log('Creating Eazy Stores Advanced Plan (₹30000 for 3 months)...');
    const storesAdvancedPlan = await razorpay.plans.create({
      period: 'monthly',
      interval: 3,
      item: {
        name: 'Eazy Stores Advanced Plan',
        amount: 3000000, // ₹30000 in paise
        currency: 'INR',
        description: '₹30000 for 3 months (₹20 first month, then ₹30000 for 3 months)',
      },
    });
    console.log(`✅ Eazy Stores Advanced Plan created: ${storesAdvancedPlan.id}`);
    console.log(`   Add to .env: RAZORPAY_PLAN_STORES_ADVANCED_ID=${storesAdvancedPlan.id}\n`);

    console.log('\n📋 Summary – copy and paste into your .env file:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('# EazyDS Platform plans');
    console.log(`RAZORPAY_PLAN_MONTHLY_ID=${monthlyPlan.id}`);
    console.log(`RAZORPAY_PLAN_PRO_ID=${proPlan.id}`);
    console.log(`RAZORPAY_PLAN_LIFETIME_ID=${lifetimePlan.id}`);
    console.log('# Token charge (₹20 for UPI autopay mandate)');
    console.log(`RAZORPAY_PLAN_TOKEN_ID=${tokenPlan.id}`);
    console.log('# Eazy Stores plans (stores_basic_free has no plan – free tier)');
    console.log(`RAZORPAY_PLAN_STORES_GROW_ID=${storesGrowPlan.id}`);
    console.log(`RAZORPAY_PLAN_STORES_ADVANCED_ID=${storesAdvancedPlan.id}`);
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
