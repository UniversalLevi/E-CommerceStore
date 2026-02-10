'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Copy, Share2, TrendingUp, DollarSign, Users, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { formatCurrency, getStatusColor, formatDate, MIN_PAYOUT_AMOUNT, validatePayoutAmount } from '@/lib/affiliate';
import { Affiliate, CommissionStats, AffiliateCommission, AffiliatePayout } from '@/types/affiliate';
import CommissionTable from '@/components/affiliates/CommissionTable';
import PayoutTable from '@/components/affiliates/PayoutTable';
import Button from '@/components/Button';

export default function AffiliateDashboardPage() {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [commissionsPage, setCommissionsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [referralsPage, setReferralsPage] = useState(1);
  const [commissionsTotalPages, setCommissionsTotalPages] = useState(1);
  const [payoutsTotalPages, setPayoutsTotalPages] = useState(1);
  const [referralsTotalPages, setReferralsTotalPages] = useState(1);
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [commissionsPage, payoutsPage, referralsPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [affiliateRes, statsRes, commissionsRes, payoutsRes, referralsRes] = await Promise.all([
        api.get<{ success: boolean; data: Affiliate | null }>('/api/affiliates/me'),
        api.get<{ success: boolean; data: CommissionStats }>('/api/affiliates/stats'),
        api.get<{ success: boolean; data: { commissions: AffiliateCommission[]; pagination?: any } }>(
          `/api/affiliates/commissions?page=${commissionsPage}&limit=20`
        ),
        api.get<{ success: boolean; data: { payouts: AffiliatePayout[]; pagination?: any } }>(
          `/api/affiliates/payout/history?page=${payoutsPage}&limit=20`
        ),
        api.get<{ success: boolean; data: { referrals: any[]; pagination?: any } }>(
          `/api/affiliates/referrals?page=${referralsPage}&limit=20`
        ),
      ]);

      if (affiliateRes.success && affiliateRes.data) {
        setAffiliate(affiliateRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
        if (statsRes.data.recentCommissions) {
          setCommissions(statsRes.data.recentCommissions);
        }
      }
      if (commissionsRes.success && commissionsRes.data) {
        setCommissions(commissionsRes.data.commissions || []);
        if (commissionsRes.data.pagination) {
          setCommissionsTotalPages(commissionsRes.data.pagination.pages || 1);
        }
      }
      if (payoutsRes.success && payoutsRes.data) {
        setPayouts(payoutsRes.data.payouts || []);
        if (payoutsRes.data.pagination) {
          setPayoutsTotalPages(payoutsRes.data.pagination.pages || 1);
        }
      }
      if (referralsRes.success && referralsRes.data) {
        setReferrals(referralsRes.data.referrals || []);
        if (referralsRes.data.pagination) {
          setReferralsTotalPages(referralsRes.data.pagination.pages || 1);
        }
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        notify.error(error.response?.data?.message || 'Failed to load affiliate data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      const response = await api.post<{ success: boolean }>('/api/affiliates/apply');
      if (response.success) {
        notify.success('Affiliate application submitted!');
        fetchData();
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to apply');
    }
  };

  const copyReferralLink = () => {
    if (affiliate) {
      const link = affiliate.referralLink || 
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/register?ref=${affiliate.referralCode}`;
      
      navigator.clipboard.writeText(link);
      notify.success('Referral link copied!');
    }
  };

  const shareReferralLink = async () => {
    if (affiliate) {
      const link = affiliate.referralLink || 
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/register?ref=${affiliate.referralCode}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Join EazyDS',
            text: 'Start your dropshipping journey with me!',
            url: link,
          });
        } catch (error) {
          // User cancelled or error occurred
          copyReferralLink();
        }
      } else {
        copyReferralLink();
      }
    }
  };

  const handleRequestPayout = async () => {
    if (!stats) return;

    const validation = validatePayoutAmount(stats.approvedCommissions);
    if (!validation.valid) {
      notify.error(validation.message || 'Minimum payout amount not reached');
      return;
    }

    try {
      setRequestingPayout(true);
      const response = await api.post<{ success: boolean }>('/api/affiliates/payout/request');
      if (response.success) {
        notify.success('Payout request submitted successfully!');
        fetchData();
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to request payout');
    } finally {
      setRequestingPayout(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-5 w-5 text-green-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case 'suspended':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading affiliate dashboard...</p>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass-card border border-white/10 rounded-2xl p-8 text-center">
          <div className="mb-6">
            <Share2 className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4">Become an Affiliate</h1>
            <p className="text-text-secondary mb-2">
              Earn commissions by referring new customers to our platform
            </p>
            <div className="mt-4 space-y-2 text-sm text-text-secondary">
              <p>• 20% commission on Starter plans</p>
              <p>• 25% commission on Growth plans</p>
              <p>• 30% commission on Lifetime plans</p>
            </div>
          </div>
          <Button onClick={handleApply} className="px-8 py-3">
            Apply Now
          </Button>
        </div>
      </div>
    );
  }

  const referralLink = affiliate.referralLink || 
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/register?ref=${affiliate.referralCode}`;

  const conversionRate = stats && stats.totalReferrals > 0
    ? ((stats.totalCommissions > 0 ? 1 : 0) / stats.totalReferrals * 100).toFixed(1)
    : '0';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Affiliate Dashboard</h1>
            <div className="flex items-center gap-3">
              <span className="text-text-secondary">Status:</span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${getStatusColor(affiliate.status)}`}>
                {getStatusIcon(affiliate.status)}
                <span className="font-semibold">{affiliate.status.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-purple-400" />
              <span className="text-2xl font-bold">{stats.totalReferrals}</span>
            </div>
            <p className="text-text-secondary text-sm">Total Referrals</p>
            {stats.totalReferrals > 0 && (
              <p className="text-text-muted text-xs mt-1">{conversionRate}% conversion rate</p>
            )}
          </div>

          <div className="glass-card border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-yellow-400" />
              <span className="text-2xl font-bold">{formatCurrency(stats.pendingCommissions)}</span>
            </div>
            <p className="text-text-secondary text-sm">Pending Commissions</p>
          </div>

          <div className="glass-card border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <span className="text-2xl font-bold">{formatCurrency(stats.paidCommissions)}</span>
            </div>
            <p className="text-text-secondary text-sm">Paid Commissions</p>
          </div>

          <div className="glass-card border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <span className="text-2xl font-bold">{formatCurrency(stats.totalCommissions)}</span>
            </div>
            <p className="text-text-secondary text-sm">Total Commissions</p>
          </div>
        </div>
      )}

      {/* Referral Link */}
      <div className="glass-card border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Referral Link</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary"
          />
          <Button
            onClick={copyReferralLink}
            variant="secondary"
            className="px-4"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              onClick={shareReferralLink}
              variant="secondary"
              className="px-4"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
        </div>
        <p className="text-sm text-text-secondary">
          Share this link with others to earn commissions on their subscriptions. Your referral code: <span className="font-mono font-semibold">{affiliate.referralCode}</span>
        </p>
      </div>

      {/* Payout Request */}
      {affiliate.status === 'active' && stats && stats.approvedCommissions >= MIN_PAYOUT_AMOUNT && (
        <div className="glass-card border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Request Payout</h2>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-secondary">Available for payout:</span>
                <span className="text-xl font-bold text-green-400">
                  {formatCurrency(stats.approvedCommissions)}
                </span>
              </div>
              <p className="text-sm text-text-muted mt-2">
                Minimum payout amount: {formatCurrency(MIN_PAYOUT_AMOUNT)}
              </p>
            </div>
            <Button
              onClick={handleRequestPayout}
              loading={requestingPayout}
              disabled={stats.approvedCommissions < MIN_PAYOUT_AMOUNT}
              className="w-full md:w-auto"
            >
              Request Payout
            </Button>
          </div>
        </div>
      )}

      {/* Referrals */}
      <div className="glass-card border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Referrals</h2>
        {referrals.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No referrals yet. Share your referral link to start earning!</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">User</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Joined</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Converted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {referrals.map((referral) => {
                    const user = referral.referredUserId;
                    const isConverted = referral.status === 'converted';
                    return (
                      <tr key={referral._id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          {user ? (
                            <div>
                              <div className="font-medium text-text-primary">
                                {typeof user === 'object' ? user.name || user.email : 'Unknown'}
                              </div>
                              {typeof user === 'object' && user.email && (
                                <div className="text-sm text-text-muted">{user.email}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-text-muted">Pending...</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              isConverted
                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                : referral.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                            }`}
                          >
                            {referral.status === 'converted' ? 'Converted' : referral.status === 'pending' ? 'Pending' : 'Expired'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-text-muted">
                          {formatDate(referral.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-sm text-text-muted">
                          {referral.convertedAt ? formatDate(referral.convertedAt) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {referralsTotalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <Button
                  onClick={() => setReferralsPage((p) => Math.max(1, p - 1))}
                  disabled={referralsPage === 1}
                  variant="secondary"
                  className="px-4"
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-text-secondary">
                  Page {referralsPage} of {referralsTotalPages}
                </span>
                <Button
                  onClick={() => setReferralsPage((p) => Math.min(referralsTotalPages, p + 1))}
                  disabled={referralsPage >= referralsTotalPages}
                  variant="secondary"
                  className="px-4"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Commissions */}
      <div className="glass-card border border-white/10 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Commission History</h2>
        </div>
        {commissions.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No commissions yet.</p>
            <p className="text-sm text-text-muted">
              Commissions are created when referred users purchase plans. For trial subscriptions, commissions are created when the full payment is charged after the trial period ends.
            </p>
          </div>
        ) : (
          <CommissionTable
            commissions={commissions}
            page={commissionsPage}
            totalPages={commissionsTotalPages}
            onPageChange={setCommissionsPage}
          />
        )}
      </div>

      {/* Payout History */}
      {payouts.length > 0 && (
        <div className="glass-card border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Payout History</h2>
          <PayoutTable
            payouts={payouts}
            page={payoutsPage}
            totalPages={payoutsTotalPages}
            onPageChange={setPayoutsPage}
          />
        </div>
      )}
    </div>
  );
}
