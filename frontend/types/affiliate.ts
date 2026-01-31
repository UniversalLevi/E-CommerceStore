/**
 * Affiliate system type definitions
 */

export type AffiliateStatus = 'pending' | 'active' | 'suspended' | 'rejected';
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'revoked' | 'cancelled';
export type PayoutStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export interface Affiliate {
  _id: string;
  userId: string | {
    _id: string;
    name: string;
    email: string;
    mobile?: string;
  };
  status: AffiliateStatus;
  referralCode: string;
  referralLink?: string;
  customCommissionRates?: {
    starter_30?: number;
    growth_90?: number;
    lifetime?: number;
  };
  totalReferrals: number;
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  adminNotes?: string;
  fraudFlags?: string[];
  applicationDate: string;
  approvalDate?: string;
  suspendedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateCommission {
  _id: string;
  affiliateId: string | Affiliate;
  referredUserId: string | {
    _id: string;
    name: string;
    email: string;
  };
  subscriptionId: string | {
    _id: string;
    planCode: string;
    amountPaid: number;
  };
  paymentId: string;
  planCode: 'starter_30' | 'growth_90' | 'lifetime';
  subscriptionAmount: number; // in paise
  commissionRate: number; // Percentage as decimal
  commissionAmount: number; // in paise
  status: CommissionStatus;
  paymentStatus: string;
  isRefunded: boolean;
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
  revokedAt?: string;
  adminNotes?: string;
}

export interface AffiliatePayout {
  _id: string;
  affiliateId: string | Affiliate;
  amount: number; // in paise
  status: PayoutStatus;
  requestedAt: string;
  approvedAt?: string;
  paidAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  walletTransactionId?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralTracking {
  _id: string;
  affiliateId: string | Affiliate;
  referralCode: string;
  referredUserId?: string | {
    _id: string;
    name: string;
    email: string;
  };
  trackingMethod: 'link' | 'code';
  cookieData?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'pending' | 'converted' | 'expired';
  convertedAt?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionStats {
  totalReferrals: number;
  pendingCommissions: number;
  approvedCommissions: number;
  paidCommissions: number;
  totalCommissions: number;
  recentCommissions: AffiliateCommission[];
}

export interface PayoutStats {
  totalPayouts: number;
  pendingPayouts: number;
  approvedPayouts: number;
  paidPayouts: number;
  rejectedPayouts: number;
  totalPayoutAmount: number;
}
