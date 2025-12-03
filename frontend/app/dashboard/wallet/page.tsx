'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { notify } from '@/lib/toast';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionLock from '@/components/SubscriptionLock';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  ShoppingCart,
} from 'lucide-react';

interface WalletData {
  balance: number;
  balanceFormatted: string;
  currency: string;
}

interface Transaction {
  id: string;
  amount: number;
  amountFormatted: string;
  type: 'credit' | 'debit';
  reason: string;
  referenceId: string;
  orderId: any;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

const TOPUP_AMOUNTS = [
  { value: 50000, label: '₹500' },
  { value: 100000, label: '₹1,000' },
  { value: 200000, label: '₹2,000' },
  { value: 500000, label: '₹5,000' },
  { value: 1000000, label: '₹10,000' },
];

export default function WalletPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  const router = useRouter();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const pageSize = 20;
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (!authLoading && isAuthenticated && !hasActiveSubscription) {
    return <SubscriptionLock featureName="Wallet" />;
  }

  const fetchWallet = useCallback(async () => {
    try {
      const response = await api.getWallet();
      if (response.success) {
        setWallet(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);
      const response = await api.getWalletTransactions({
        limit: pageSize,
        offset: page * pageSize,
        type: typeFilter === 'all' ? undefined : typeFilter,
      });
      
      if (response.success) {
        setTransactions(response.data);
        setTotalTransactions(response.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWallet();
    }
  }, [isAuthenticated, fetchWallet]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
    }
  }, [isAuthenticated, fetchTransactions]);

  const handleTopup = async () => {
    const amount = isCustom ? parseInt(customAmount) * 100 : topupAmount;

    if (!amount || amount < 10000) {
      notify.error('Minimum topup amount is ₹100');
      return;
    }

    if (amount > 10000000) {
      notify.error('Maximum topup amount is ₹1,00,000');
      return;
    }

    try {
      setTopupLoading(true);
      const orderResponse = await api.createWalletTopupOrder(amount);
      
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error('Failed to create topup order');
      }

      const { orderId, amount: orderAmount, currency, keyId } = orderResponse.data;

      await openRazorpayCheckout(
        {
          key: keyId,
          amount: orderAmount,
          currency,
          name: 'EAZY DROPSHIPPING',
          description: 'Wallet Top-up',
          order_id: orderId,
          theme: { color: '#22c55e' },
        },
        async (response) => {
          try {
            const verifyResponse = await api.verifyWalletTopup({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.success) {
              notify.success(`${verifyResponse.data.amountFormatted} added to wallet!`);
              setShowTopupModal(false);
              fetchWallet();
              fetchTransactions();
            }
          } catch (err: any) {
            notify.error(err?.message || 'Payment verification failed');
          } finally {
            setTopupLoading(false);
          }
        },
        (error) => {
          notify.error(error?.message || 'Payment cancelled');
          setTopupLoading(false);
        }
      );
    } catch (error: any) {
      notify.error(error?.message || 'Failed to initiate topup');
      setTopupLoading(false);
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

  const getTransactionIcon = (type: 'credit' | 'debit', reason: string) => {
    if (reason.toLowerCase().includes('order')) {
      return <ShoppingCart className="w-4 h-4" />;
    }
    if (reason.toLowerCase().includes('topup') || reason.toLowerCase().includes('recharge')) {
      return <CreditCard className="w-4 h-4" />;
    }
    return type === 'credit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />;
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      tx.reason.toLowerCase().includes(term) ||
      tx.referenceId?.toLowerCase().includes(term) ||
      tx.amountFormatted.includes(term)
    );
  });

  const totalPages = Math.ceil(totalTransactions / pageSize);

  if (authLoading || loading) {
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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <Wallet className="w-8 h-8 text-emerald-400" />
              My Wallet
            </h1>
            <p className="mt-2 text-text-secondary">
              Manage your balance and track transactions
            </p>
          </div>

          {/* Wallet Card */}
          <div className="bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/20 border border-emerald-500/30 rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-emerald-400/70 text-sm font-medium uppercase tracking-wide mb-1">
                  Available Balance
                </p>
                <p className="text-4xl md:text-5xl font-bold text-emerald-400">
                  {wallet?.balanceFormatted || '₹0.00'}
                </p>
                <p className="text-text-muted text-sm mt-2">
                  Currency: {wallet?.currency || 'INR'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowTopupModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/25"
                >
                  <Plus className="w-5 h-5" />
                  Add Money
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-surface-raised border border-border-default rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-text-secondary" />
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as any);
                    setPage(0);
                  }}
                  className="px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Transactions</option>
                  <option value="credit">Credits Only</option>
                  <option value="debit">Debits Only</option>
                </select>
              </div>
              <button
                onClick={() => {
                  fetchWallet();
                  fetchTransactions();
                }}
                className="p-2 bg-surface-elevated border border-border-default rounded-lg hover:bg-surface-hover transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-text-secondary ${transactionsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-default">
              <h2 className="text-lg font-semibold text-text-primary">Transaction History</h2>
              <p className="text-sm text-text-muted">{totalTransactions} total transactions</p>
            </div>

            {transactionsLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto" />
                <p className="mt-4 text-text-secondary">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <Wallet className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary">No transactions found</h3>
                <p className="text-text-secondary mt-1">
                  {searchTerm || typeFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Your transaction history will appear here'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-default">
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className="px-6 py-4 hover:bg-surface-hover transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === 'credit'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {getTransactionIcon(tx.type, tx.reason)}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{tx.reason}</p>
                          <p className="text-sm text-text-muted">{formatDate(tx.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tx.type === 'credit' ? '+' : '-'}{tx.amountFormatted}
                        </p>
                        <p className="text-xs text-text-muted">
                          Balance: ₹{(tx.balanceAfter / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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
                    className="p-2 bg-surface-elevated border border-border-default rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 bg-surface-elevated border border-border-default rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Topup Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowTopupModal(false)} />
          <div className="relative bg-surface-raised border border-border-default rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in">
            <button
              onClick={() => setShowTopupModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/20 rounded-full mb-4">
                <Plus className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Add Money to Wallet</h2>
              <p className="text-text-secondary text-sm mt-1">Select or enter an amount</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {TOPUP_AMOUNTS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    setTopupAmount(preset.value);
                    setIsCustom(false);
                  }}
                  className={`py-3 px-4 rounded-xl font-medium transition-all ${
                    !isCustom && topupAmount === preset.value
                      ? 'bg-emerald-500 text-black'
                      : 'bg-surface-elevated border border-border-default text-text-primary hover:border-emerald-500/50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <button
                onClick={() => setIsCustom(true)}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                  isCustom
                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                    : 'bg-surface-elevated border border-border-default text-text-secondary hover:border-emerald-500/50'
                }`}
              >
                {isCustom ? 'Custom Amount' : 'Enter Custom Amount'}
              </button>
              {isCustom && (
                <div className="mt-3 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">₹</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-4 py-3 bg-surface-base border border-border-default text-text-primary rounded-xl focus:ring-2 focus:ring-emerald-500"
                    min="100"
                    max="100000"
                  />
                </div>
              )}
            </div>

            <div className="bg-surface-elevated rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Amount to add</span>
                <span className="text-xl font-bold text-emerald-400">
                  ₹{((isCustom ? parseInt(customAmount) * 100 || 0 : topupAmount) / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={handleTopup}
              disabled={topupLoading || (isCustom && (!customAmount || parseInt(customAmount) < 100))}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
            >
              {topupLoading ? 'Processing...' : 'Add Money'}
            </button>

            <p className="text-center text-text-muted text-xs mt-4">
              Secured by Razorpay. Min ₹100, Max ₹1,00,000
            </p>
          </div>
        </div>
      )}

      <style jsx global>{`
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
