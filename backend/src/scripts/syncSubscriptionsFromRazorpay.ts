/**
 * Sync subscriptions from Razorpay into the database
 *
 * Use this when subscriptions were lost (e.g. DB wipe, wrong DB) but Razorpay
 * still has the payment/subscription records.
 *
 * Run: npx ts-node src/scripts/syncSubscriptionsFromRazorpay.ts
 * Or:  npm run sync-razorpay-subscriptions (add script to package.json)
 *
 * Prerequisites:
 * - RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env
 * - RAZORPAY_PLAN_*_ID vars in .env (to map plan_id -> planCode)
 * - Users must exist in DB (matched by email from Razorpay customer)
 *
 * The script will:
 * 1. Fetch all subscriptions from Razorpay
 * 2. For each active subscription: get customer email, find User, create Subscription
 * 3. Output list of emails that couldn't be matched (no User in DB)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { config } from '../config/env';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { plans, PlanCode, isStorePlan } from '../config/plans';

dotenv.config();

const Razorpay = require('razorpay');

interface RazorpaySubscription {
  id: string;
  plan_id: string;
  customer_id?: string;
  status: string;
  start_at: number;
  end_at?: number;
  current_start?: number;
  current_end?: number;
  paid_count?: number;
  total_count?: number;
  notes?: Record<string, string>;
}

interface RazorpayCustomer {
  id: string;
  email?: string;
  contact?: string;
}

// Build reverse map: Razorpay plan_id -> our planCode
function buildPlanIdToCodeMap(): Map<string, PlanCode> {
  const map = new Map<string, PlanCode>();
  // From .env (current plans)
  const planIds = [
    ['RAZORPAY_PLAN_MONTHLY_ID', 'starter_30'],
    ['RAZORPAY_PLAN_PRO_ID', 'growth_90'],
    ['RAZORPAY_PLAN_LIFETIME_ID', 'lifetime'],
    ['RAZORPAY_PLAN_STORES_GROW_ID', 'stores_grow'],
    ['RAZORPAY_PLAN_STORES_ADVANCED_ID', 'stores_advanced'],
  ] as const;
  for (const [envKey, planCode] of planIds) {
    const planId = process.env[envKey];
    if (planId && planId.trim()) {
      map.set(planId.trim(), planCode);
    }
  }
  // Legacy plan IDs (from old Razorpay plans)
  const legacyPlans: [string, PlanCode][] = [
    ['plan_SAyRvpiqMHHAPx', 'growth_90'],   // Pro Plan ₹3999
    ['plan_SAyRwPyT7kMF3Q', 'lifetime'],    // Lifetime Plan ₹9999
    ['plan_SAyRvArjRDefdY', 'starter_30'],  // Monthly Plan ₹999
    ['plan_S4qrSlRvfOKm2c', 'starter_30'],  // Monthly ₹999
    ['plan_S4WBElVqLqIfwF', 'starter_30'],  // Monthly Plan ₹999
    ['plan_S4W4aO0JfefyVp', 'starter_30'],  // Monthly Plan ₹999
    ['plan_S4UHPZdB9JLKU3', 'starter_30'],  // Monthly Plan ₹999
    ['plan_S3lDwbXBWvlWIp', 'starter_30'],  // Monthly Plan ₹999
    ['plan_RpOc46MsBhprwW', 'starter_30'],  // Eazy Dropshipping ₹999
  ];
  for (const [planId, planCode] of legacyPlans) {
    if (!map.has(planId)) map.set(planId, planCode);
  }
  return map;
}

async function fetchAllRazorpaySubscriptions(razorpay: any): Promise<RazorpaySubscription[]> {
  const all: RazorpaySubscription[] = [];
  let skip = 0;
  const count = 100;

  while (true) {
    const result = await razorpay.subscriptions.all({ count, skip });
    const items = result.items || [];
    all.push(...items);
    if (items.length < count) break;
    skip += count;
  }
  return all;
}

async function getCustomerEmail(razorpay: any, customerId: string): Promise<string | null> {
  try {
    const customer: RazorpayCustomer = await razorpay.customers.fetch(customerId);
    return customer?.email || null;
  } catch (err: any) {
    console.warn(`  ⚠ Could not fetch customer ${customerId}:`, err.message);
    return null;
  }
}

async function getEmailFromInvoices(razorpay: any, subscriptionId: string): Promise<string | null> {
  try {
    const result = await razorpay.invoices.all({ subscription_id: subscriptionId, count: 1 });
    const items = result?.items || [];
    const inv = items.find((i: any) => i.status === 'paid') || items[0];
    const email = inv?.customer_details?.email || inv?.customer_details?.customer_email;
    return email || null;
  } catch {
    return null;
  }
}

async function syncSubscriptionsFromRazorpay() {
  console.log('\n🔄 Syncing subscriptions from Razorpay...\n');

  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    console.error('❌ RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required in .env');
    process.exit(1);
  }

  const razorpay = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
  });

  const planIdToCode = buildPlanIdToCodeMap();
  if (planIdToCode.size === 0) {
    console.error('❌ No RAZORPAY_PLAN_*_ID env vars found. Add plan IDs to map Razorpay plans.');
    process.exit(1);
  }
  console.log('📋 Plan mapping:', Object.fromEntries(planIdToCode));

  await mongoose.connect(config.mongoUri);
  console.log('✅ Connected to database\n');

  const razorpaySubs = await fetchAllRazorpaySubscriptions(razorpay);
  console.log(`📊 Found ${razorpaySubs.length} subscriptions in Razorpay\n`);

  const activeStatuses = ['active', 'authenticated', 'created'];
  let created = 0;
  let skipped = 0;
  let noUser: string[] = [];
  let unknownPlan: string[] = [];

  for (const rsub of razorpaySubs) {
    if (!activeStatuses.includes(rsub.status)) {
      continue;
    }

    const planCode = planIdToCode.get(rsub.plan_id);
    if (!planCode) {
      unknownPlan.push(`${rsub.id} (plan_id: ${rsub.plan_id})`);
      continue;
    }

    let email: string | null = null;
    if (rsub.notes?.email) {
      email = rsub.notes.email;
    }
    if (!email && rsub.customer_id) {
      email = await getCustomerEmail(razorpay, rsub.customer_id);
    }
    if (!email) {
      email = await getEmailFromInvoices(razorpay, rsub.id);
    }
    if (rsub.notes?.userId) {
      const user = await User.findById(rsub.notes.userId);
      if (user) {
        email = user.email || null;
      }
    }

    if (!email) {
      noUser.push(`sub_${rsub.id} (no customer_id or email in notes)`);
      continue;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      noUser.push(email);
      continue;
    }

    const existing = await Subscription.findOne({
      userId: user._id,
      razorpaySubscriptionId: rsub.id,
    });
    if (existing) {
      skipped++;
      continue;
    }

    const existingActive = await Subscription.findOne({
      userId: user._id,
      status: { $in: ['active', 'manually_granted'] },
      planCode,
    });
    if (existingActive) {
      skipped++;
      continue;
    }

    const plan = plans[planCode];
    const startDate = rsub.start_at ? new Date(rsub.start_at * 1000) : new Date();
    const endDate = rsub.end_at ? new Date(rsub.end_at * 1000) : (plan.isLifetime ? null : undefined);

    await Subscription.create({
      userId: user._id,
      planCode,
      razorpaySubscriptionId: rsub.id,
      razorpayPlanId: rsub.plan_id,
      status: 'manually_granted',
      startDate,
      endDate: endDate || (plan.isLifetime ? null : undefined),
      amountPaid: plan.price,
      source: 'razorpay',
      history: [
        {
          action: 'manual_granted',
          timestamp: new Date(),
          notes: `Restored from Razorpay subscription ${rsub.id}`,
        },
      ],
    });

    if (!isStorePlan(planCode)) {
      user.plan = planCode;
      user.planExpiresAt = endDate || null;
      user.isLifetime = plan.isLifetime;
      await user.save();
    }

    console.log(`  ✅ ${email} -> ${planCode}`);
    created++;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Sync complete: created ${created}, skipped ${skipped}`);
  if (noUser.length > 0) {
    console.log('\n⚠ No matching User in DB for these (create users or fix email):');
    noUser.forEach((e) => console.log(`   - ${e}`));
  }
  if (unknownPlan.length > 0) {
    console.log('\n⚠ Unknown plan_id (add to .env or planIdToCode):');
    unknownPlan.forEach((e) => console.log(`   - ${e}`));
  }
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

syncSubscriptionsFromRazorpay().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
