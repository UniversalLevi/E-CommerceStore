'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import AdminLayout from '@/components/AdminLayout';
import {
  Wallet,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  User,
  CreditCard,
  Building2,
  Smartphone,
  Coins,
  FileText,
} from 'lucide-react';

interface WithdrawalRequest {
  _id: string;
  userId: {
    _id: string;
    name?: string;
    email: string;
  };
  payoutMethodId: {
    _id: string;
    type: 'bank' | 'upi' | 'crypto';
    label: string;
    bankAccount?: {
      bankName?: string;
      accountHolderName?: string;
      accountNumber?: string;
      ifsc?: string;
    };
    upi?: {
      upiId?: string;
    };
    crypto?: {
      network?: string;
      address?: string;
      asset?: string;
    };
  } | null;
  amount: number; // amount debited from wallet (in paise)
  feeAmount: number; // fee deducted from amount (in paise)
  grossAmount: number; // same as amount for backward compatibility
  currency: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'paid' | 'failed';
  requestedAt: string;
  processedAt?: string;
  adminNote?: string;
  userNote?: string;
  txRef?: string;
  createdAt: string;
}

export default function AdminWithdrawalsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected withdrawal for detail view
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState<{
    status: string;
    adminNote: string;
    txRef: string;
  }>({
    status: '',
    adminNote: '',
    txRef: '',
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.adminGetWithdrawals({
        status: statusFilter || undefined,
        limit,
        offset,
      });

      if (response.success) {
        setWithdrawals(response.data);
        setTotal(response.pagination.total);
      }
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, offset]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchWithdrawals();
    }
  }, [isAuthenticated, user, fetchWithdrawals]);

  const handleStatusUpdate = async () => {
    if (!selectedWithdrawal || !statusUpdate.status) {
      notify.error('Please select a status');
      return;
    }

    try {
      setUpdating(true);
      const response = await api.adminUpdateWithdrawalStatus(selectedWithdrawal._id, {
        status: statusUpdate.status as any,
        adminNote: statusUpdate.adminNote || undefined,
        txRef: statusUpdate.txRef || undefined,
      });

      if (response.success) {
        notify.success('Withdrawal status updated successfully');
        setShowStatusModal(false);
        setSelectedWithdrawal(null);
        setStatusUpdate({ status: '', adminNote: '', txRef: '' });
        fetchWithdrawals();
      }
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to update withdrawal status');
    } finally {
      setUpdating(false);
    }
  };

  const openStatusModal = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setStatusUpdate({
      status: withdrawal.status,
      adminNote: withdrawal.adminNote || '',
      txRef: withdrawal.txRef || '',
    });
    setShowStatusModal(true);
  };

  const formatAmount = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'approved':
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'approved':
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getPayoutMethodIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <Building2 className="w-4 h-4" />;
      case 'upi':
        return <Smartphone className="w-4 h-4" />;
      case 'crypto':
        return <Coins className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const formatPayoutDetails = (method: NonNullable<WithdrawalRequest['payoutMethodId']>) => {
    if (method.type === 'bank' && method.bankAccount) {
      return `${method.bankAccount.bankName || 'Bank'} - ${method.bankAccount.accountNumber?.slice(-4) || 'N/A'}`;
    } else if (method.type === 'upi' && method.upi) {
      return method.upi.upiId || 'N/A';
    } else if (method.type === 'crypto' && method.crypto) {
      return `${method.crypto.asset || 'Crypto'} - ${method.crypto.address?.slice(0, 8)}...${method.crypto.address?.slice(-4) || ''}`;
    }
    return 'N/A';
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      w.userId.email.toLowerCase().includes(search) ||
      w.userId.name?.toLowerCase().includes(search) ||
      w._id.toLowerCase().includes(search) ||
      formatAmount(w.amount).toLowerCase().includes(search)
    );
  });

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <Wallet className="w-8 h-8 text-yellow-500" />
              Withdrawal Requests
            </h1>
            <p className="text-text-secondary mt-2">Manage user withdrawal requests and process payouts</p>
          </div>
          <button
            onClick={fetchWithdrawals}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary hover:bg-surface-elevated transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface-raised border border-border-default rounded-lg p-4">
            <div className="text-text-secondary text-sm mb-1">Total Requests</div>
            <div className="text-2xl font-bold text-text-primary">{total}</div>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-lg p-4">
            <div className="text-text-secondary text-sm mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-500">
              {withdrawals.filter((w) => w.status === 'pending').length}
            </div>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-lg p-4">
            <div className="text-text-secondary text-sm mb-1">Processing</div>
            <div className="text-2xl font-bold text-blue-500">
              {withdrawals.filter((w) => w.status === 'processing' || w.status === 'approved').length}
            </div>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-lg p-4">
            <div className="text-text-secondary text-sm mb-1">Paid</div>
            <div className="text-2xl font-bold text-green-500">
              {withdrawals.filter((w) => w.status === 'paid').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface-raised border border-border-default rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search by email, name, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setOffset(0);
              }}
              className="px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-surface-raised border border-border-default rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
              <p className="text-text-secondary mt-4">Loading withdrawals...</p>
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="p-8 text-center">
              <Wallet className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No withdrawal requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-elevated border-b border-border-default">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Fee</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Payout Method</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Requested</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {filteredWithdrawals.map((withdrawal) => (
                    <tr
                      key={withdrawal._id}
                      className="hover:bg-surface-elevated transition-colors cursor-pointer"
                      onClick={() => openStatusModal(withdrawal)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-text-muted" />
                          <div>
                            <div className="text-sm font-medium text-text-primary">
                              {withdrawal.userId.name || 'N/A'}
                            </div>
                            <div className="text-xs text-text-muted">{withdrawal.userId.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-text-muted" />
                          <div>
                            <div className="text-sm font-medium text-text-primary">{formatAmount(withdrawal.amount)}</div>
                            <div className="text-xs text-text-muted">Net: {formatAmount(withdrawal.amount - withdrawal.feeAmount)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-secondary">{formatAmount(withdrawal.feeAmount)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {withdrawal.payoutMethodId && getPayoutMethodIcon(withdrawal.payoutMethodId.type)}
                          <div>
                            <div className="text-sm font-medium text-text-primary">
                              {withdrawal.payoutMethodId?.label || 'N/A'}
                            </div>
                            <div className="text-xs text-text-muted">
                              {withdrawal.payoutMethodId ? formatPayoutDetails(withdrawal.payoutMethodId) : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                            withdrawal.status
                          )}`}
                        >
                          {getStatusIcon(withdrawal.status)}
                          {withdrawal.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-secondary">
                          {new Date(withdrawal.requestedAt || withdrawal.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openStatusModal(withdrawal);
                          }}
                          disabled={withdrawal.status === 'rejected' || withdrawal.status === 'paid'}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            withdrawal.status === 'rejected' || withdrawal.status === 'paid'
                              ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30 cursor-not-allowed'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30'
                          }`}
                          title={
                            withdrawal.status === 'rejected'
                              ? 'Rejected withdrawals cannot be modified'
                              : withdrawal.status === 'paid'
                              ? 'Paid withdrawals cannot be modified'
                              : 'Update Status'
                          }
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && total > limit && (
            <div className="bg-surface-elevated border-t border-border-default px-4 py-3 flex items-center justify-between">
              <div className="text-sm text-text-secondary">
                Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="p-2 bg-surface-raised border border-border-default rounded text-text-primary hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="p-2 bg-surface-raised border border-border-default rounded text-text-primary hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status Update Modal */}
        {showStatusModal && selectedWithdrawal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-raised border border-border-default rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border-default">
                <h2 className="text-xl font-bold text-text-primary">Update Withdrawal Status</h2>
                <p className="text-sm text-text-secondary mt-1">ID: {selectedWithdrawal._id}</p>
              </div>

              <div className="p-6 space-y-4">
                {/* User Info */}
                <div className="bg-surface-elevated border border-border-default rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-text-secondary mb-3">User Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-text-muted mb-1">Name</div>
                      <div className="text-sm text-text-primary">{selectedWithdrawal.userId.name || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted mb-1">Email</div>
                      <div className="text-sm text-text-primary">{selectedWithdrawal.userId.email}</div>
                    </div>
                  </div>
                </div>

                {/* Amount Info */}
                <div className="bg-surface-elevated border border-border-default rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-text-secondary mb-3">Amount Details</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-text-muted mb-1">Requested</div>
                      <div className="text-sm font-medium text-text-primary">{formatAmount(selectedWithdrawal.amount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted mb-1">Fee (8%)</div>
                      <div className="text-sm font-medium text-text-secondary">{formatAmount(selectedWithdrawal.feeAmount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted mb-1">Net Amount (After Fee)</div>
                      <div className="text-sm font-medium text-text-primary">{formatAmount(selectedWithdrawal.amount - selectedWithdrawal.feeAmount)}</div>
                    </div>
                  </div>
                </div>

                {/* Payout Method Details */}
                <div className="bg-surface-elevated border border-border-default rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-text-secondary mb-3">Payout Method</h3>
                  <div className="space-y-2">
                    {selectedWithdrawal.payoutMethodId ? (
                      <>
                        <div className="flex items-center gap-2">
                          {getPayoutMethodIcon(selectedWithdrawal.payoutMethodId.type)}
                          <span className="text-sm font-medium text-text-primary">{selectedWithdrawal.payoutMethodId.label}</span>
                          <span className="text-xs text-text-muted">({selectedWithdrawal.payoutMethodId.type.toUpperCase()})</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-text-muted">Payout method not found</div>
                    )}
                    {selectedWithdrawal.payoutMethodId &&
                     selectedWithdrawal.payoutMethodId.type === 'bank' &&
                     selectedWithdrawal.payoutMethodId.bankAccount && (
                      <div className="text-xs text-text-muted space-y-1 ml-6">
                        <div className="font-semibold text-text-primary mb-1">Bank Account Details:</div>
                        <div>Bank Name: {selectedWithdrawal.payoutMethodId.bankAccount.bankName || 'N/A'}</div>
                        <div>Account Number: {selectedWithdrawal.payoutMethodId.bankAccount.accountNumber || 'N/A'}</div>
                        <div>IFSC Code: {selectedWithdrawal.payoutMethodId.bankAccount.ifsc || 'N/A'}</div>
                        <div>Account Holder: {selectedWithdrawal.payoutMethodId.bankAccount.accountHolderName || 'N/A'}</div>
                      </div>
                    )}
                    {selectedWithdrawal.payoutMethodId &&
                     selectedWithdrawal.payoutMethodId.type === 'upi' &&
                     selectedWithdrawal.payoutMethodId.upi && (
                      <div className="text-xs text-text-muted ml-6">
                        <div className="font-semibold text-text-primary mb-1">UPI Details:</div>
                        <div>UPI ID: <span className="font-mono text-text-primary">{selectedWithdrawal.payoutMethodId.upi.upiId || 'N/A'}</span></div>
                      </div>
                    )}
                    {selectedWithdrawal.payoutMethodId &&
                     selectedWithdrawal.payoutMethodId.type === 'crypto' &&
                     selectedWithdrawal.payoutMethodId.crypto && (
                      <div className="text-xs text-text-muted space-y-1 ml-6">
                        <div className="font-semibold text-text-primary mb-1">Crypto Wallet Details:</div>
                        <div>Network: {selectedWithdrawal.payoutMethodId.crypto.network || 'N/A'}</div>
                        <div>Asset: {selectedWithdrawal.payoutMethodId.crypto.asset || 'N/A'}</div>
                        <div>Wallet Address: <span className="font-mono text-text-primary break-all">{selectedWithdrawal.payoutMethodId.crypto.address || 'N/A'}</span></div>
                      </div>
                    )}
                    {selectedWithdrawal.payoutMethodId && 
                     !selectedWithdrawal.payoutMethodId.bankAccount && 
                     !selectedWithdrawal.payoutMethodId.upi && 
                     !selectedWithdrawal.payoutMethodId.crypto && (
                      <div className="text-xs text-red-400 ml-6">⚠️ Payout method details not available. Please contact the user.</div>
                    )}
                  </div>
                </div>

                {/* Status Update Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Status</label>
                    <select
                      value={statusUpdate.status}
                      onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                      disabled={selectedWithdrawal.status === 'rejected' || selectedWithdrawal.status === 'paid'}
                      className={`w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                        selectedWithdrawal.status === 'rejected' || selectedWithdrawal.status === 'paid'
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="approved">Approved</option>
                      <option value="paid">Paid</option>
                      <option value="rejected">Rejected</option>
                      <option value="failed">Failed</option>
                    </select>
                    {selectedWithdrawal.status === 'rejected' && (
                      <p className="text-xs text-red-400 mt-1">This withdrawal has been rejected and cannot be modified.</p>
                    )}
                    {selectedWithdrawal.status === 'paid' && (
                      <p className="text-xs text-green-400 mt-1">This withdrawal has been paid and cannot be modified.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Transaction Reference (Optional)
                    </label>
                    <input
                      type="text"
                      value={statusUpdate.txRef}
                      onChange={(e) => setStatusUpdate({ ...statusUpdate, txRef: e.target.value })}
                      placeholder="e.g., UPI ref, bank txn ID, crypto hash"
                      className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Admin Note (Optional)</label>
                    <textarea
                      value={statusUpdate.adminNote}
                      onChange={(e) => setStatusUpdate({ ...statusUpdate, adminNote: e.target.value })}
                      placeholder="Internal notes about this withdrawal..."
                      rows={3}
                      className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>

                  {selectedWithdrawal.userNote && (
                    <div className="bg-surface-elevated border border-border-default rounded-lg p-4">
                      <div className="text-xs text-text-muted mb-1">User Note</div>
                      <div className="text-sm text-text-primary">{selectedWithdrawal.userNote}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-border-default flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedWithdrawal(null);
                    setStatusUpdate({ status: '', adminNote: '', txRef: '' });
                  }}
                  className="px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating || !statusUpdate.status || selectedWithdrawal.status === 'rejected' || selectedWithdrawal.status === 'paid'}
                  className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    selectedWithdrawal.status === 'rejected'
                      ? 'Rejected withdrawals cannot be modified'
                      : selectedWithdrawal.status === 'paid'
                      ? 'Paid withdrawals cannot be modified'
                      : ''
                  }
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
                {selectedWithdrawal.status === 'rejected' && (
                  <p className="text-xs text-red-400 mt-2">This withdrawal has been rejected and cannot be modified.</p>
                )}
                {selectedWithdrawal.status === 'paid' && (
                  <p className="text-xs text-green-400 mt-2">This withdrawal has been paid and cannot be modified.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

