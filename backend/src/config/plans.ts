export const plans = {
  starter_30: {
    price: 99900, // in paise (₹999) - full amount
    durationDays: 30, // Monthly subscription duration
    isLifetime: false,
    maxProducts: 5,
    name: 'Monthly Plan',
    razorpayPlanId: process.env.RAZORPAY_PLAN_MONTHLY_ID || '', // Set via env
    features: [
      'Basic product addition (up to 5 products)',
      'Limited stores',
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
      'Multiple stores',
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

