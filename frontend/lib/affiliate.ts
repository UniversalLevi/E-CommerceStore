/**
 * Affiliate utility functions
 */

export const formatCurrency = (amount: number): string => {
  return `₹${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
    case 'paid':
    case 'approved':
      return 'bg-green-500/20 text-green-400';
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'suspended':
    case 'rejected':
    case 'revoked':
      return 'bg-red-500/20 text-red-400';
    case 'cancelled':
      return 'bg-gray-500/20 text-gray-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getPlanDisplayName = (planCode: string): string => {
  const planNames: Record<string, string> = {
    starter_30: 'Starter (30 days)',
    growth_90: 'Growth (90 days)',
    lifetime: 'Lifetime',
  };
  return planNames[planCode] || planCode;
};

export const calculateCommissionRate = (
  planCode: 'starter_30' | 'growth_90' | 'lifetime',
  customRates?: {
    starter_30?: number;
    growth_90?: number;
    lifetime?: number;
  }
): number => {
  const defaultRates = {
    starter_30: 0.20, // 20%
    growth_90: 0.25,  // 25%
    lifetime: 0.30,   // 30%
  };
  return customRates?.[planCode] ?? defaultRates[planCode];
};

export const MIN_PAYOUT_AMOUNT = 100000; // ₹1,000 in paise

export const validatePayoutAmount = (amount: number): { valid: boolean; message?: string } => {
  if (amount < MIN_PAYOUT_AMOUNT) {
    return {
      valid: false,
      message: `Minimum payout amount is ${formatCurrency(MIN_PAYOUT_AMOUNT)}`,
    };
  }
  return { valid: true };
};
