'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import {
  Wallet,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Minus,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react';

interface WalletEntry {
  id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    mobile?: string;
  };
  balance: number;
  balanceFormatted: string;
  currency: string;
  autoRechargeEnabled: boolean;
  autoRechargeAmount: number | null;
  minAutoRechargeThreshold: number;
  createdAt: string;
  updatedAt: string;
}

interface WalletStats {
  totalLiability: number;
  totalLiabilityFormatted: string;
}

interface Transaction {
  id: string;
  amount: number;
  amountFormatted: string;
  type: 'credit' | 'debit';
  reason: string;
  referenceId: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  metadata: any;
}

export default function AdminWalletsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('balance');
  const [sortOrder, setSortOrder] = useState('desc');

  // Selected wallet for detail view
  const [selectedWallet, setSelectedWallet] = useState<WalletEntry | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Adjustment modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustReference, setAdjustReference] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('limit', pageSize.toString());
      params.append('offset', (page * pageSize).toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await api.get<{
        success: boolean;
        data: WalletEntry[];
        pagination: { total: number };
        stats: WalletStats;
      }>(`/api/wallet/admin?${params.toString()}`);

      if (response.success) {
        setWallets(response.data);
        setTotal(response.pagination.total);
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      notify.error('Failed to load wallets');
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchWallets();
    }
  }, [isAuthenticated, user, fetchWallets]);

  const fetchUserTransactions = async (userId: string) => {
    try {
      setTransactionsLoading(true);
      const response = await api.get<{
        success: boolean;
        data: Transaction[];
      }>(`/api/wallet/admin/${userId}/transactions?limit=50`);

      if (response.success) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      notify.error('Failed to load transactions');
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleAdjustWallet = async () => {
    if (!selectedWallet || !adjustAmount || !adjustReason) {
      notify.error('Please fill in all required fields');
      return;
    }

    const amountPaise = Math.round(parseFloat(adjustAmount) * 100);
    if (isNaN(amountPaise) || amountPaise <= 0) {
      notify.error('Please enter a valid amount');
      return;
    }

    try {
      setAdjustLoading(true);
      const response = await api.post<{
        success: boolean;
        message: string;
        data: { balanceAfterFormatted: string };
      }>(`/api/wallet/admin/${selectedWallet.user._id}/adjust`, {
        amount: amountPaise,
        type: adjustType,
        reason: adjustReason,
        reference: adjustReference || undefined,
      });

      if (response.success) {
        notify.success(`Wallet ${adjustType}ed successfully. New balance: ${response.data.balanceAfterFormatted}`);
        setShowAdjustModal(false);
        setAdjustAmount('');
        setAdjustReason('');
        setAdjustReference('');
        fetchWallets();
        fetchUserTransactions(selectedWallet.user._id);
      }
    } catch (error: any) {
      notify.error(error?.response?.data?.error || 'Failed to adjust wallet');
    } finally {
      setAdjustLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter wallets by search
  const filteredWallets = wallets.filter((w) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      w.user?.name?.toLowerCase().includes(term) ||
      w.user?.email?.toLowerCase().includes(term) ||
      w.user?.mobile?.includes(term)
    );
  });

  const totalPages = Math.ceil(total / pageSize);

  if (authLoading || (isAuthenticated && user?.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" />
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <Wallet className="w-8 h-8 text-emerald-400" />
              Wallet Management
            </h1>
            <p className="mt-2 text-text-secondary">
              View and manage all user wallets
            </p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Total Liability</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">{stats.totalLiabilityFormatted}</p>
              </div>
              <div className="bg-surface-raised border border-border-default rounded-xl p-4">
                <div className="flex items-center gap-2 text-text-secondary mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Total Wallets</span>
                </div>
                <p className="text-2xl font-bold text-text-primary">{total}</p>
              </div>
              <div className="bg-surface-raised border border-border-default rounded-xl p-4">
                <div className="flex items-center gap-2 text-text-secondary mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Avg Balance</span>
                </div>
                <p className="text-2xl font-bold text-text-primary">
                  ₹{total > 0 ? ((stats.totalLiability / total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })) : '0.00'}
                </p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-surface-raised border border-border-default rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="Search by name, email, mobile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="balance">Sort by Balance</option>
                  <option value="createdAt">Sort by Created</option>
                  <option value="updatedAt">Sort by Updated</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="desc">High to Low</option>
                  <option value="asc">Low to High</option>
                </select>
                <button
                  onClick={fetchWallets}
                  className="p-2 bg-surface-elevated border border-border-default rounded-lg hover:bg-surface-hover transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Wallets Table */}
          <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto" />
                <p className="mt-4 text-text-secondary">Loading wallets...</p>
              </div>
            ) : filteredWallets.length === 0 ? (
              <div className="p-12 text-center">
                <Wallet className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary">No wallets found</h3>
                <p className="text-text-secondary mt-1">
                  {searchTerm ? 'Try adjusting your search' : 'User wallets will appear here'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-full divide-y divide-border-default">
                  <thead className="bg-surface-elevated">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">User</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Balance</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Auto-Recharge</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Last Updated</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {filteredWallets.map((wallet) => (
                      <tr key={wallet.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                              {wallet.user?.name?.[0]?.toUpperCase() || wallet.user?.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">{wallet.user?.name || 'Unknown'}</p>
                              <p className="text-sm text-text-muted">{wallet.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-emerald-400 text-lg">{wallet.balanceFormatted}</p>
                        </td>
                        <td className="px-6 py-4">
                          {wallet.autoRechargeEnabled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs">
                              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                              Enabled
                            </span>
                          ) : (
                            <span className="text-text-muted text-sm">Disabled</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-text-secondary">{formatDate(wallet.updatedAt)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedWallet(wallet);
                              fetchUserTransactions(wallet.user._id);
                            }}
                            className="px-3 py-1.5 bg-surface-elevated border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition-colors text-sm"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border-default flex items-center justify-between">
                <p className="text-sm text-text-muted">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-2 bg-surface-elevated border border-border-default rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 bg-surface-elevated border border-border-default rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Detail Slide-over */}
      {selectedWallet && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedWallet(null)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-xl flex">
            <div className="w-full bg-surface-raised border-l border-border-default flex flex-col overflow-hidden animate-slide-in-right">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border-default bg-surface-elevated">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                    {selectedWallet.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">{selectedWallet.user?.name || 'Unknown'}</h2>
                    <p className="text-sm text-text-secondary">{selectedWallet.user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWallet(null)}
                  className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <p className="text-sm text-emerald-400/70 font-medium mb-1">Current Balance</p>
                  <p className="text-3xl font-bold text-emerald-400">{selectedWallet.balanceFormatted}</p>
                </div>

                {/* Adjust Wallet */}
                <div className="bg-surface-elevated rounded-xl p-4">
                  <h3 className="font-semibold text-text-primary mb-4">Manual Adjustment</h3>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => {
                        setAdjustType('credit');
                        setShowAdjustModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Credit
                    </button>
                    <button
                      onClick={() => {
                        setAdjustType('debit');
                        setShowAdjustModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 rounded-lg transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                      Deduct
                    </button>
                  </div>
                </div>

                {/* Transaction History */}
                <div className="bg-surface-elevated rounded-xl p-4">
                  <h3 className="font-semibold text-text-primary mb-4">Recent Transactions</h3>
                  {transactionsLoading ? (
                    <div className="py-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <p className="text-text-muted text-center py-4">No transactions yet</p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border-default last:border-0">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                tx.type === 'credit'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {tx.type === 'credit' ? (
                                <ArrowDownLeft className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">{tx.reason}</p>
                              <p className="text-xs text-text-muted">{formatDate(tx.createdAt)}</p>
                            </div>
                          </div>
                          <p
                            className={`font-bold ${
                              tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {tx.type === 'credit' ? '+' : '-'}{tx.amountFormatted}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustModal && selectedWallet && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAdjustModal(false)} />
          <div className="relative bg-surface-raised border border-border-default rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in">
            <button
              onClick={() => setShowAdjustModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>

            <div className="text-center mb-6">
              <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${
                  adjustType === 'credit' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                }`}
              >
                {adjustType === 'credit' ? (
                  <Plus className="w-7 h-7 text-emerald-400" />
                ) : (
                  <Minus className="w-7 h-7 text-rose-400" />
                )}
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                {adjustType === 'credit' ? 'Add Credit' : 'Deduct Amount'}
              </h2>
              <p className="text-text-secondary text-sm mt-1">
                {selectedWallet.user?.name || selectedWallet.user?.email}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Amount (₹) *</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 bg-surface-base border border-border-default text-text-primary rounded-xl focus:ring-2 focus:ring-emerald-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Reason *</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g., Promotional credit, Refund, Correction"
                  className="w-full px-4 py-3 bg-surface-base border border-border-default text-text-primary rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Reference ID (Optional)</label>
                <input
                  type="text"
                  value={adjustReference}
                  onChange={(e) => setAdjustReference(e.target.value)}
                  placeholder="e.g., ticket ID, order ID"
                  className="w-full px-4 py-3 bg-surface-base border border-border-default text-text-primary rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleAdjustWallet}
              disabled={adjustLoading || !adjustAmount || !adjustReason}
              className={`w-full py-4 font-bold rounded-xl transition-all disabled:opacity-50 ${
                adjustType === 'credit'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-black'
                  : 'bg-rose-500 hover:bg-rose-600 text-white'
              }`}
            >
              {adjustLoading
                ? 'Processing...'
                : adjustType === 'credit'
                ? 'Add Credit'
                : 'Deduct Amount'}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

