'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Check, X, Ban, Download, Search, Settings, ExternalLink } from 'lucide-react';
import { formatCurrency, getStatusColor } from '@/lib/affiliate';
import { Affiliate } from '@/types/affiliate';
import CommissionTable from '@/components/affiliates/CommissionTable';
import PayoutTable from '@/components/affiliates/PayoutTable';
import CommissionAdjustModal from '@/components/affiliates/CommissionAdjustModal';
import PayoutApprovalModal from '@/components/affiliates/PayoutApprovalModal';
import Button from '@/components/Button';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminAffiliatesPage() {
  const router = useRouter();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDetails, setShowDetails] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: string;
    affiliateId: string;
    message: string;
  }>({
    isOpen: false,
    action: '',
    affiliateId: '',
    message: '',
  });

  useEffect(() => {
    fetchAffiliates();
  }, [statusFilter, searchQuery]);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await api.get<{
        success: boolean;
        data: { affiliates: Affiliate[] };
      }>(`/api/admin/affiliates?${params.toString()}`);

      if (response.success && response.data) {
        setAffiliates(response.data.affiliates || []);
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to load affiliates');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      action: 'approve',
      affiliateId: id,
      message: 'Are you sure you want to approve this affiliate?',
    });
  };

  const handleReject = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      action: 'reject',
      affiliateId: id,
      message: 'Are you sure you want to reject this affiliate?',
    });
  };

  const handleSuspend = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      action: 'suspend',
      affiliateId: id,
      message: 'Are you sure you want to suspend this affiliate?',
    });
  };

  const executeAction = async () => {
    const { action, affiliateId } = confirmModal;
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

      const response = await api.post(endpoint, payload);
      if (response.success) {
        notify.success(`Affiliate ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'suspended'}`);
        fetchAffiliates();
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || `Failed to ${action}`);
    } finally {
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/affiliates/export`, {
        credentials: 'include',
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'affiliates.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      notify.success('Export downloaded');
    } catch (error) {
      notify.error('Failed to export');
    }
  };

  const handleCommissionAction = (commissionId: string, action: string) => {
    const commission = selectedAffiliate ? 
      (selectedAffiliate as any).commissions?.find((c: any) => c._id === commissionId) : null;
    
    if (commission) {
      setSelectedCommission(commission);
      setShowCommissionModal(true);
    }
  };

  const handlePayoutAction = (payoutId: string, action: string) => {
    const payout = selectedAffiliate ? 
      (selectedAffiliate as any).payouts?.find((p: any) => p._id === payoutId) : null;
    
    if (payout) {
      setSelectedPayout(payout);
      setShowPayoutModal(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Affiliate Management</h1>
          <p className="text-text-secondary">Manage affiliates, commissions, and payouts</p>
        </div>
        <Button onClick={handleExport} variant="secondary">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-card border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Affiliates Table */}
      <div className="glass-card border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          </div>
        ) : affiliates.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">No affiliates found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left py-3 px-4 text-text-secondary font-semibold">User</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-semibold">Referral Code</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-semibold">Referrals</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-semibold">Total Commissions</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-semibold">Paid</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-semibold">Pending</th>
                  <th className="text-left py-3 px-4 text-text-secondary font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((affiliate) => {
                  const userId = typeof affiliate.userId === 'object' ? affiliate.userId : null;
                  
                  return (
                    <tr
                      key={affiliate._id}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                      onClick={() => {
                        setSelectedAffiliate(affiliate);
                        setShowDetails(true);
                      }}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-text-primary font-medium">
                            {userId?.name || 'Unknown'}
                          </div>
                          <div className="text-text-secondary text-sm">
                            {userId?.email || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-primary font-mono">{affiliate.referralCode}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(affiliate.status)}`}>
                          {affiliate.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-primary">{affiliate.totalReferrals}</td>
                      <td className="py-3 px-4 text-text-primary">{formatCurrency(affiliate.totalCommissions)}</td>
                      <td className="py-3 px-4 text-green-400">{formatCurrency(affiliate.paidCommissions)}</td>
                      <td className="py-3 px-4 text-yellow-400">{formatCurrency(affiliate.pendingCommissions)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {affiliate.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(affiliate._id)}
                                className="p-1 text-green-400 hover:bg-green-500/20 rounded transition-colors"
                                title="Approve"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleReject(affiliate._id)}
                                className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                                title="Reject"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {affiliate.status === 'active' && (
                            <button
                              onClick={() => handleSuspend(affiliate._id)}
                              className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                              title="Suspend"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/admin/affiliates/${affiliate._id}`)}
                            className="p-1 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                            title="View Details"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedAffiliate && (
        <AffiliateDetailsModal
          affiliate={selectedAffiliate}
          onClose={() => {
            setShowDetails(false);
            setSelectedAffiliate(null);
          }}
          onCommissionAction={handleCommissionAction}
          onPayoutAction={handlePayoutAction}
        />
      )}

      {/* Commission Adjust Modal */}
      {showCommissionModal && selectedCommission && selectedAffiliate && (
        <CommissionAdjustModal
          commissionId={selectedCommission._id}
          affiliateId={selectedAffiliate._id}
          currentAmount={selectedCommission.commissionAmount}
          currentStatus={selectedCommission.status}
          onClose={() => {
            setShowCommissionModal(false);
            setSelectedCommission(null);
          }}
          onSuccess={() => {
            fetchAffiliates();
            if (showDetails && selectedAffiliate) {
              // Refresh details
            }
          }}
        />
      )}

      {/* Payout Approval Modal */}
      {showPayoutModal && selectedPayout && selectedAffiliate && (
        <PayoutApprovalModal
          payout={selectedPayout}
          affiliateId={selectedAffiliate._id}
          onClose={() => {
            setShowPayoutModal(false);
            setSelectedPayout(null);
          }}
          onSuccess={() => {
            fetchAffiliates();
            if (showDetails && selectedAffiliate) {
              // Refresh details
            }
          }}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={`${confirmModal.action.charAt(0).toUpperCase() + confirmModal.action.slice(1)} Affiliate`}
        message={confirmModal.message}
        onConfirm={executeAction}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        confirmText={confirmModal.action === 'approve' ? 'Approve' : confirmModal.action === 'reject' ? 'Reject' : 'Suspend'}
        variant={confirmModal.action === 'reject' || confirmModal.action === 'suspend' ? 'danger' : 'info'}
      />
    </div>
  );
}

function AffiliateDetailsModal({
  affiliate,
  onClose,
  onCommissionAction,
  onPayoutAction,
}: {
  affiliate: Affiliate;
  onClose: () => void;
  onCommissionAction?: (commissionId: string, action: string) => void;
  onPayoutAction?: (payoutId: string, action: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'commissions' | 'payouts' | 'referrals'>('overview');
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commissionsPage, setCommissionsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);

  useEffect(() => {
    fetchDetails();
  }, [affiliate._id, activeTab, commissionsPage, payoutsPage]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const promises: Promise<any>[] = [];

      if (activeTab === 'commissions' || activeTab === 'overview') {
        promises.push(api.get(`/api/admin/affiliates/${affiliate._id}/commissions?page=${commissionsPage}&limit=20`));
      }
      if (activeTab === 'payouts' || activeTab === 'overview') {
        promises.push(api.get(`/api/admin/affiliates/${affiliate._id}`));
      }

      const results = await Promise.all(promises);

      if (results[0]?.success && results[0]?.data) {
        setCommissions(results[0].data.commissions || []);
      }
      if (results[1]?.success && results[1]?.data) {
        const affiliateData = results[1].data;
        if (affiliateData.affiliate?.stats?.payouts) {
          setPayouts(affiliateData.affiliate.stats.payouts);
        } else if (affiliateData.stats?.payouts) {
          setPayouts(affiliateData.stats.payouts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch details:', error);
    } finally {
      setLoading(false);
    }
  };

  const userId = typeof affiliate.userId === 'object' ? affiliate.userId : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card border border-white/10 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Affiliate Details</h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-white/10">
            {(['overview', 'commissions', 'payouts', 'referrals'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <>
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
                      <span className="text-text-secondary">Referral Code:</span>
                      <span className="text-text-primary font-mono">{affiliate.referralCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(affiliate.status)}`}>
                        {affiliate.status}
                      </span>
                    </div>
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

                <div>
                  <h3 className="font-semibold mb-3">Recent Commissions</h3>
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
                    </div>
                  ) : (
                    <CommissionTable
                      commissions={commissions.slice(0, 5)}
                      showActions={false}
                    />
                  )}
                </div>
              </>
            )}

            {activeTab === 'commissions' && (
              <div>
                <h3 className="font-semibold mb-3">Commissions</h3>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
                  </div>
                ) : (
                  <CommissionTable
                    commissions={commissions}
                    showActions={!!onCommissionAction}
                    onAction={onCommissionAction}
                    page={commissionsPage}
                    onPageChange={setCommissionsPage}
                  />
                )}
              </div>
            )}

            {activeTab === 'payouts' && (
              <div>
                <h3 className="font-semibold mb-3">Payouts</h3>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
                  </div>
                ) : (
                  <PayoutTable
                    payouts={payouts}
                    showActions={!!onPayoutAction}
                    onAction={onPayoutAction}
                    page={payoutsPage}
                    onPageChange={setPayoutsPage}
                  />
                )}
              </div>
            )}

            {activeTab === 'referrals' && (
              <div>
                <h3 className="font-semibold mb-3">Referrals</h3>
                <p className="text-text-secondary">Referral tracking data will be displayed here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
