export const plans = {
  // EazyDS Platform Plans
  starter_30: {
    price: 99900, // in paise (₹999) - full amount
    durationDays: 30, // Monthly subscription duration
    isLifetime: false,
    maxProducts: 5,
    name: 'Monthly Plan',
    razorpayPlanId: process.env.RAZORPAY_PLAN_MONTHLY_ID || '', // Set via env
    features: [
      'Basic product addition (up to 5 products)',
    ],
  },
  growth_90: {
    price: 399900, // in paise (₹3999) - 5 months
    durationDays: 150, // 5 months (150 days)
    isLifetime: false,
    maxProducts: 15,
    name: 'Pro Plan',
    razorpayPlanId: process.env.RAZORPAY_PLAN_PRO_ID || '', // Set via env
    features: [
      'Medium product addition (up to 15 products)',
      'Priority support',
    ],
  },
  lifetime: {
    price: 999900, // in paise (₹9999) - one-time payment
    durationDays: null,
    isLifetime: true,
    maxProducts: null, // null = unlimited
    name: 'Lifetime Plan',
    razorpayPlanId: process.env.RAZORPAY_PLAN_LIFETIME_ID || '', // Set via env
    features: [
      'Unlimited products',
      'All features forever',
      'Premium support',
    ],
  },
  // Eazy Stores Plans
  stores_basic_free: {
    price: 0, // Free plan
    durationDays: null, // Free tier - no expiration
    isLifetime: false,
    maxProducts: null,
    name: 'Basic Plan',
    razorpayPlanId: '', // No Razorpay plan for free tier
    features: [
      'Basic store features',
      'Free forever',
    ],
  },
  stores_grow: {
    price: 700000, // in paise (₹7000) - 3 months after first month
    firstMonthPrice: 2000, // in paise (₹20) - first month token charge
    durationDays: 90, // 3 months (90 days)
    isLifetime: false,
    maxProducts: null,
    name: 'Grow Plan',
    razorpayPlanId: process.env.RAZORPAY_PLAN_STORES_GROW_ID || '', // Set via env
    features: [
      'All store features',
      'Priority support',
      'Advanced analytics',
    ],
  },
  stores_advanced: {
    price: 3000000, // in paise (₹30000) - 3 months after first month
    firstMonthPrice: 2000, // in paise (₹20) - first month token charge
    durationDays: 90, // 3 months (90 days)
    isLifetime: false,
    maxProducts: null,
    name: 'Advanced Plan',
    razorpayPlanId: process.env.RAZORPAY_PLAN_STORES_ADVANCED_ID || '', // Set via env
    features: [
      'All store features',
      'Premium support',
      'Advanced analytics',
      'Custom integrations',
    ],
  },
} as const;

// Token charge amount for mandate consent (₹20)
export const TOKEN_CHARGE_AMOUNT = 2000; // in paise

export type PlanCode = keyof typeof plans;

// Helper function to get plan by code
export function getPlan(planCode: string) {
  return plans[planCode as PlanCode] || null;
}

// Helper function to check if plan code is valid
export function isValidPlanCode(planCode: string): planCode is PlanCode {
  return planCode in plans;
}

// Helper function to check if plan code is for Eazy Stores
export function isStorePlan(planCode: string): boolean {
  return planCode.startsWith('stores_');
}

// Helper function to check if plan code is for EazyDS Platform
export function isPlatformPlan(planCode: string): boolean {
  return !isStorePlan(planCode);
}

