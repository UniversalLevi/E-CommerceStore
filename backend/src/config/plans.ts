export const plans = {
  starter_30: {
    price: 99900, // in paise (₹999)
    durationDays: 30,
    isLifetime: false,
    maxProducts: 5,
    name: 'Starter Monthly',
    features: [
      'Basic product addition (up to 5 products)',
      'Limited stores',
    ],
  },
  growth_90: {
    price: 249900, // in paise (₹2499)
    durationDays: 90,
    isLifetime: false,
    maxProducts: 15,
    name: 'Growth Quarterly',
    features: [
      'Medium product addition (up to 15 products)',
      'Multiple stores',
      'Priority support',
    ],
  },
  lifetime: {
    price: 999900, // in paise (₹9999)
    durationDays: null,
    isLifetime: true,
    maxProducts: null, // null = unlimited
    name: 'Lifetime',
    features: [
      'Unlimited products',
      'All features forever',
      'Premium support',
    ],
  },
} as const;

export type PlanCode = keyof typeof plans;

// Helper function to get plan by code
export function getPlan(planCode: string) {
  return plans[planCode as PlanCode] || null;
}

// Helper function to check if plan code is valid
export function isValidPlanCode(planCode: string): planCode is PlanCode {
  return planCode in plans;
}

