export const COMMISSION_RATES = {
  starter_30: 0.20, // 20%
  growth_90: 0.25,  // 25%
  lifetime: 0.30,   // 30%
};

export const MIN_PAYOUT_AMOUNT = 100000; // ₹1,000 in paise
export const COMMISSION_HOLDING_DAYS = 14;
export const REFERRAL_COOKIE_EXPIRY_DAYS = 30;
export const REFERRAL_COOKIE_NAME = 'affiliate_ref';

// Commission status configuration
export const AUTO_APPROVE_COMMISSIONS = false; // Set to true to auto-approve commissions after holding period
export const ENABLE_LIFETIME_COMMISSIONS_ON_RENEWALS = false; // Set to true to pay commissions on subscription renewals
