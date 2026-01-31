'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { ArrowLeft, Settings, Check, X, Ban } from 'lucide-react';
import { formatCurrency, getStatusColor, formatDate, getPlanDisplayName } from '@/lib/affiliate';
import { Affiliate, AffiliateCommission, AffiliatePayout } from '@/types/affiliate';
import CommissionTable from '@/components/affiliates/CommissionTable';
import PayoutTable from '@/components/affiliates/PayoutTable';
import CommissionAdjustModal from '@/components/affiliates/CommissionAdjustModal';
import PayoutApprovalModal from '@/components/affiliates/PayoutApprovalModal';
import Button from '@/components/Button';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminAffiliateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const affiliateId = params.id as string;

  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'commissions' | 'payouts' | 'referrals' | 'settings'>('overview');
  const [commissionsPage, setCommissionsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [commissionsTotalPages, setCommissionsTotalPages] = useState(1);
  const [payoutsTotalPages, setPayoutsTotalPages] = useState(1);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [showCustomRates, setShowCustomRates] = useState(false);
  const [customRates, setCustomRates] = useState({
    starter_30: '',
    growth_90: '',
    lifetime: '',
  });
  const [savingRates, setSavingRates] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: string;
    message: string;
  }>({
    isOpen: false,
    action: '',
    message: '',
  });

  useEffect(() => {
    if (affiliateId) {
      fetchData();
    }
  }, [affiliateId, commissionsPage, payoutsPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [affiliateRes, commissionsRes, payoutsRes] = await Promise.all([
        api.get<{ success: boolean; data: { affiliate: Affiliate; stats?: any } }>(
          `/api/admin/affiliates/${affiliateId}`
        ),
        api.get<{ success: boolean; data: { commissions: AffiliateCommission[]; pagination?: any } }>(
          `/api/admin/affiliates/${affiliateId}/commissions?page=${commissionsPage}&limit=20`
        ),
        api.get<{ success: boolean; data: { payouts: AffiliatePayout[]; pagination?: any } }>(
          `/api/admin/affiliates/${affiliateId}`
        ),
      ]);

      if (affiliateRes.success && affiliateRes.data) {
        const affiliateData = affiliateRes.data;
        const affiliate = affiliateData.affiliate || affiliateData;
        setAffiliate(affiliate);
        if (affiliate.customCommissionRates) {
          setCustomRates({
            starter_30: affiliate.customCommissionRates.starter_30
              ? (affiliate.customCommissionRates.starter_30 * 100).toString()
              : '',
            growth_90: affiliate.customCommissionRates.growth_90
              ? (affiliate.customCommissionRates.growth_90 * 100).toString()
              : '',
            lifetime: affiliate.customCommissionRates.lifetime
              ? (affiliate.customCommissionRates.lifetime * 100).toString()
              : '',
          });
        }
        if (affiliateData.stats?.payouts) {
          setPayouts(affiliateData.stats.payouts);
        }
      }
      if (commissionsRes.success && commissionsRes.data) {
        setCommissions(commissionsRes.data.commissions || []);
        if (commissionsRes.data.pagination) {
          setCommissionsTotalPages(commissionsRes.data.pagination.pages || 1);
        }
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to load affiliate data');
    } finally {
      setLoading(false);
    }
  };

  const handleCommissionAction = (commissionId: string, action: string) => {
    const commission = commissions.find((c) => c._id === commissionId);
    if (commission) {
      setSelectedCommission(commission);
      setShowCommissionModal(true);
    }
  };

  const handlePayoutAction = (payoutId: string, action: string) => {
    const payout = payouts.find((p) => p._id === payoutId);
    if (payout) {
      setSelectedPayout(payout);
      setShowPayoutModal(true);
    }
  };

  const handleSaveCustomRates = async () => {
    try {
      setSavingRates(true);
      const payload: any = {};
      
      if (customRates.starter_30) {
        payload.starter_30 = parseFloat(customRates.starter_30) / 100;
      }
      if (customRates.growth_90) {
        payload.growth_90 = parseFloat(customRates.growth_90) / 100;
      }
      if (customRates.lifetime) {
        payload.lifetime = parseFloat(customRates.lifetime) / 100;
      }

      const response = await api.put<{ success: boolean }>(
        `/api/admin/affiliates/${affiliateId}/commission-rate`,
        payload
      );

      if (response.success) {
        notify.success('Commission rates updated successfully');
        fetchData();
        setShowCustomRates(false);
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to update commission rates');
    } finally {
      setSavingRates(false);
    }
  };

  const handleStatusChange = async (action: 'approve' | 'reject' | 'suspend') => {
    setConfirmModal({
      isOpen: true,
      action,
      message: `Are you sure you want to ${action} this affiliate?`,
    });
  };

  const executeStatusChange = async () => {
    const { action } = confirmModal;
    let endpoint = '';
    let payload: any = {};

    try {
      if (action === 'approve') {
        endpoint = `/api/admin/affiliates/${affiliateId}/approve`;
      } else if (action === 'reject') {
        const reason = prompt('Rejection reason:');
        if (!reason) {
          setConfirmModal({ ...confirmModal, isOpen: false });
          return;
        }
        endpoint = `/api/admin/affiliates/${affiliateId}/reject`;
        payload = { reason };
      } else if (action === 'suspend') {
        const reason = prompt('Suspension reason:');
        if (!reason) {
          setConfirmModal({ ...confirmModal, isOpen: false });
          return;
        }
        endpoint = `/api/admin/affiliates/${affiliateId}/suspend`;
        payload = { reason };
      }

      const response = await api.post<{ success: boolean }>(endpoint, payload);
      if (response.success) {
        notify.success(`Affiliate ${action}ed successfully`);
        fetchData();
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || `Failed to ${action} affiliate`);
    } finally {
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  if (loading && !affiliate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading affiliate details...</p>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="glass-card border border-white/10 rounded-xl p-8 text-center">
          <p className="text-text-secondary mb-4">Affiliate not found</p>
          <Button onClick={() => router.push('/admin/affiliates')} variant="secondary">
            Back to Affiliates
          </Button>
        </div>
      </div>
    );
  }

  const userId = typeof affiliate.userId === 'object' ? affiliate.userId : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          onClick={() => router.push('/admin/affiliates')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Affiliates
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {userId?.name || 'Unknown User'}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-text-secondary">Status:</span>
              <span className={`px-3 py-1 rounded-lg text-sm ${getStatusColor(affiliate.status)}`}>
                {affiliate.status.toUpperCase()}
              </span>
              <span className="text-text-secondary">Referral Code:</span>
              <span className="font-mono text-text-primary">{affiliate.referralCode}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {affiliate.status === 'pending' && (
              <>
                <Button onClick={() => handleStatusChange('approve')} variant="primary">
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button onClick={() => handleStatusChange('reject')} variant="danger">
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            {affiliate.status === 'active' && (
              <Button onClick={() => handleStatusChange('suspend')} variant="danger">
                <Ban className="h-4 w-4 mr-2" />
                Suspend
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card border border-white/10 rounded-xl mb-6">
        <div className="flex gap-2 p-2 border-b border-white/10">
          {(['overview', 'commissions', 'payouts', 'referrals', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors rounded-lg ${
                activeTab === tab
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">User Information</h3>
                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Name:</span>
                    <span className="text-text-primary">{userId?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Email:</span>
                    <span className="text-text-primary">{userId?.email || '-'}</span>
                  </div>
                  {userId?.mobile && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Mobile:</span>
                      <span className="text-text-primary">{userId.mobile}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Application Date:</span>
                    <span className="text-text-primary">{formatDate(affiliate.applicationDate)}</span>
                  </div>
                  {affiliate.approvalDate && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Approval Date:</span>
                      <span className="text-text-primary">{formatDate(affiliate.approvalDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-2xl font-bold text-text-primary">{affiliate.totalReferrals}</div>
                    <div className="text-text-secondary text-sm">Total Referrals</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-2xl font-bold text-text-primary">{formatCurrency(affiliate.totalCommissions)}</div>
                    <div className="text-text-secondary text-sm">Total Commissions</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-400">{formatCurrency(affiliate.paidCommissions)}</div>
                    <div className="text-text-secondary text-sm">Paid</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-400">{formatCurrency(affiliate.pendingCommissions)}</div>
                    <div className="text-text-secondary text-sm">Pending</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'commissions' && (
            <div>
              <h3 className="font-semibold mb-4">Commissions</h3>
              <CommissionTable
                commissions={commissions}
                showActions={true}
                onAction={handleCommissionAction}
                page={commissionsPage}
                totalPages={commissionsTotalPages}
                onPageChange={setCommissionsPage}
              />
            </div>
          )}

          {activeTab === 'payouts' && (
            <div>
              <h3 className="font-semibold mb-4">Payouts</h3>
              <PayoutTable
                payouts={payouts}
                showActions={true}
                onAction={handlePayoutAction}
                page={payoutsPage}
                totalPages={payoutsTotalPages}
                onPageChange={setPayoutsPage}
              />
            </div>
          )}

          {activeTab === 'referrals' && (
            <div>
              <h3 className="font-semibold mb-4">Referrals</h3>
              <p className="text-text-secondary">Referral tracking data will be displayed here</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Custom Commission Rates</h3>
                  <Button
                    onClick={() => setShowCustomRates(!showCustomRates)}
                    variant="secondary"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {showCustomRates ? 'Cancel' : 'Edit Rates'}
                  </Button>
                </div>
                {showCustomRates ? (
                  <div className="bg-white/5 rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Starter 30-day Plan (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={customRates.starter_30}
                        onChange={(e) => setCustomRates({ ...customRates, starter_30: e.target.value })}
                        placeholder="20"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Growth 90-day Plan (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={customRates.growth_90}
                        onChange={(e) => setCustomRates({ ...customRates, growth_90: e.target.value })}
                        placeholder="25"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Lifetime Plan (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={customRates.lifetime}
                        onChange={(e) => setCustomRates({ ...customRates, lifetime: e.target.value })}
                        placeholder="30"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text-primary"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleSaveCustomRates} loading={savingRates}>
                        Save Rates
                      </Button>
                      <Button
                        onClick={() => {
                          setShowCustomRates(false);
                          fetchData();
                        }}
                        variant="secondary"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Starter 30-day:</span>
                      <span className="text-text-primary">
                        {affiliate.customCommissionRates?.starter_30
                          ? `${(affiliate.customCommissionRates.starter_30 * 100).toFixed(1)}%`
                          : '20% (default)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Growth 90-day:</span>
                      <span className="text-text-primary">
                        {affiliate.customCommissionRates?.growth_90
                          ? `${(affiliate.customCommissionRates.growth_90 * 100).toFixed(1)}%`
                          : '25% (default)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Lifetime:</span>
                      <span className="text-text-primary">
                        {affiliate.customCommissionRates?.lifetime
                          ? `${(affiliate.customCommissionRates.lifetime * 100).toFixed(1)}%`
                          : '30% (default)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCommissionModal && selectedCommission && (
        <CommissionAdjustModal
          commissionId={selectedCommission._id}
          affiliateId={affiliateId}
          currentAmount={selectedCommission.commissionAmount}
          currentStatus={selectedCommission.status}
          onClose={() => {
            setShowCommissionModal(false);
            setSelectedCommission(null);
          }}
          onSuccess={fetchData}
        />
      )}

      {showPayoutModal && selectedPayout && (
        <PayoutApprovalModal
          payout={selectedPayout}
          affiliateId={affiliateId}
          onClose={() => {
            setShowPayoutModal(false);
            setSelectedPayout(null);
          }}
          onSuccess={fetchData}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={`${confirmModal.action.charAt(0).toUpperCase() + confirmModal.action.slice(1)} Affiliate`}
        message={confirmModal.message}
        onConfirm={executeStatusChange}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        confirmText={confirmModal.action}
        variant={confirmModal.action === 'reject' || confirmModal.action === 'suspend' ? 'danger' : 'info'}
      />
    </div>
  );
}
