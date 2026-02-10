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

interface PayoutMethod {
  _id: string;
  type: 'bank' | 'upi' | 'crypto';
  label: string;
  isDefault: boolean;
  bankAccount?: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifsc: string;
  };
  upi?: {
    upiId: string;
  };
  crypto?: {
    network: string;
    address: string;
    asset?: string;
  };
}

interface Withdrawal {
  id: string;
  amount: number;
  feeAmount: number;
  grossAmount: number;
  amountFormatted: string;
  feeFormatted: string;
  grossFormatted: string;
  status: string;
  currency: string;
  payoutMethod: PayoutMethod;
  createdAt: string;
  processedAt?: string;
  txRef?: string;
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
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  
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

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('1000'); // in rupees
  const [selectedPayoutMethodId, setSelectedPayoutMethodId] = useState<string | 'default'>('default');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Payout method form
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutType, setPayoutType] = useState<'bank' | 'upi' | 'crypto'>('bank');
  const [payoutLabel, setPayoutLabel] = useState('');
  const [bankBankName, setBankBankName] = useState('');
  const [bankAccountHolderName, setBankAccountHolderName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoAsset, setCryptoAsset] = useState('USDT');
  const [payoutSaving, setPayoutSaving] = useState(false);

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

  const fetchPayoutMethods = useCallback(async () => {
    try {
      const response = await api.getPayoutMethods();
      if (response.success) {
        setPayoutMethods(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch payout methods:', error);
    }
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    try {
      setWithdrawalsLoading(true);
      const response = await api.getUserWithdrawals({ limit: 20, offset: 0 });
      if (response.success) {
        setWithdrawals(response.data as Withdrawal[]);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setWithdrawalsLoading(false);
    }
  }, []);

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchPayoutMethods();
      fetchWithdrawals();
    }
  }, [isAuthenticated, fetchPayoutMethods, fetchWithdrawals]);

  const handleRequestWithdrawal = async () => {
    const rupees = parseInt(withdrawAmount || '0', 10);

    if (!rupees || rupees < 1000) {
      notify.error('Minimum withdrawal amount is ₹1,000');
      return;
    }

    const amountPaise = rupees * 100;

    if (!wallet || wallet.balance < amountPaise) {
      notify.error('Insufficient wallet balance');
      return;
    }

    const defaultMethod = payoutMethods.find((m) => m.isDefault);
    const methodId =
      selectedPayoutMethodId === 'default' ? defaultMethod?._id : selectedPayoutMethodId;

    if (!methodId) {
      notify.error('Please add and select a payout method first');
      return;
    }

    try {
      setWithdrawLoading(true);
      const response = await api.requestWithdrawal({
        amount: amountPaise,
        payoutMethodId: methodId,
      });

      if (response.success) {
        notify.success(
          `Withdrawal request created for ₹${rupees.toLocaleString('en-IN')}. 8% fee will be applied.`
        );
        setShowWithdrawModal(false);
        fetchWallet();
        fetchWithdrawals();
      }
    } catch (error: any) {
      notify.error(error?.response?.data?.error || error?.message || 'Failed to request withdrawal');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleSavePayoutMethod = async () => {
    if (!payoutLabel.trim()) {
      notify.error('Please enter a label for this payout method');
      return;
    }

    try {
      setPayoutSaving(true);
      const payload: any = {
        type: payoutType,
        label: payoutLabel.trim(),
        isDefault: payoutMethods.length === 0, // first method becomes default
      };

      if (payoutType === 'bank') {
        if (!bankBankName || !bankAccountHolderName || !bankAccountNumber || !bankIfsc) {
          notify.error('Please fill all bank account details');
          setPayoutSaving(false);
          return;
        }
        payload.bankAccount = {
          bankName: bankBankName,
          accountHolderName: bankAccountHolderName,
          accountNumber: bankAccountNumber,
          ifsc: bankIfsc,
        };
      } else if (payoutType === 'upi') {
        if (!upiId) {
          notify.error('Please enter UPI ID');
          setPayoutSaving(false);
          return;
        }
        payload.upi = { upiId };
      } else if (payoutType === 'crypto') {
        if (!cryptoNetwork || !cryptoAddress) {
          notify.error('Please enter crypto network and address');
          setPayoutSaving(false);
          return;
        }
        payload.crypto = {
          network: cryptoNetwork,
          address: cryptoAddress,
          asset: cryptoAsset,
        };
      }

      const response = await api.upsertPayoutMethod(payload);
      if (response.success) {
        notify.success('Payout method saved');
        setShowPayoutForm(false);
        // reset form
        setPayoutLabel('');
        setBankBankName('');
        setBankAccountHolderName('');
        setBankAccountNumber('');
        setBankIfsc('');
        setUpiId('');
        setCryptoNetwork('');
        setCryptoAddress('');
        setCryptoAsset('USDT');
        fetchPayoutMethods();
      }
    } catch (error: any) {
      notify.error(error?.response?.data?.error || error?.message || 'Failed to save payout method');
    } finally {
      setPayoutSaving(false);
    }
  };

  const handleDeletePayoutMethod = async (id: string) => {
    try {
      await api.deletePayoutMethod(id);
      notify.success('Payout method deleted');
      fetchPayoutMethods();
    } catch (error: any) {
      notify.error(error?.response?.data?.error || error?.message || 'Failed to delete payout method');
    }
  };

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
          name: 'EazyDS',
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
                <p className="text-text-muted text-xs mt-1">
                  Minimum withdrawal: ₹1,000 • Fee: 8%
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
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-surface-elevated hover:bg-surface-hover text-text-primary font-semibold rounded-xl border border-border-default transition-colors"
                >
                  <ArrowUpRight className="w-5 h-5" />
                  Withdraw
                </button>
              </div>
            </div>
          </div>

          {/* Payout Methods */}
          <div className="bg-surface-raised border border-border-default rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Payout Methods</h2>
                <p className="text-sm text-text-muted">
                  Add your preferred way to withdraw money: bank transfer, UPI, or crypto.
                </p>
              </div>
              <button
                onClick={() => setShowPayoutForm((v) => !v)}
                className="px-4 py-2 rounded-lg bg-surface-elevated border border-border-default text-sm text-text-primary hover:bg-surface-hover transition-colors"
              >
                {showPayoutForm ? 'Close' : 'Add Method'}
              </button>
            </div>

            {showPayoutForm && (
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    Method Type
                  </label>
                  <select
                    value={payoutType}
                    onChange={(e) => setPayoutType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="bank">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="crypto">Crypto</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    Label (for your reference)
                  </label>
                  <input
                    type="text"
                    value={payoutLabel}
                    onChange={(e) => setPayoutLabel(e.target.value)}
                    placeholder="e.g. HDFC main account, personal UPI, Binance USDT"
                    className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {payoutType === 'bank' && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-text-secondary">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankBankName}
                        onChange={(e) => setBankBankName(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-text-secondary">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={bankAccountHolderName}
                        onChange={(e) => setBankAccountHolderName(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-text-secondary">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-text-secondary">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </>
                )}

                {payoutType === 'upi' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {payoutType === 'crypto' && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-text-secondary">
                        Network
                      </label>
                      <input
                        type="text"
                        value={cryptoNetwork}
                        onChange={(e) => setCryptoNetwork(e.target.value)}
                        placeholder="e.g. TRC20, ERC20, Polygon"
                        className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-text-secondary">
                        Asset
                      </label>
                      <input
                        type="text"
                        value={cryptoAsset}
                        onChange={(e) => setCryptoAsset(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-text-secondary">
                        Wallet Address
                      </label>
                      <input
                        type="text"
                        value={cryptoAddress}
                        onChange={(e) => setCryptoAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {showPayoutForm && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleSavePayoutMethod}
                  disabled={payoutSaving}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {payoutSaving ? 'Saving...' : 'Save Payout Method'}
                </button>
              </div>
            )}

            <div className="border-t border-border-default pt-4 mt-2 space-y-2">
              {payoutMethods.length === 0 ? (
                <p className="text-sm text-text-muted">
                  No payout methods added yet. Use the <span className="font-medium">Add Method</span>{' '}
                  button above to add your bank, UPI, or crypto details. These will be sent to the
                  admin team for manual withdrawals.
                </p>
              ) : (
                <div className="space-y-2">
                  {payoutMethods.map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-surface-elevated border border-border-default"
                    >
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {m.label}{' '}
                          <span className="text-xs text-text-muted">
                            ({m.type.toUpperCase()}){m.isDefault ? ' • Default' : ''}
                          </span>
                        </p>
                        {m.type === 'bank' && m.bankAccount && (
                          <p className="text-xs text-text-muted">
                            {m.bankAccount.bankName} • A/C ****
                            {m.bankAccount.accountNumber.slice(-4)} • IFSC {m.bankAccount.ifsc}
                          </p>
                        )}
                        {m.type === 'upi' && m.upi && (
                          <p className="text-xs text-text-muted">UPI: {m.upi.upiId}</p>
                        )}
                        {m.type === 'crypto' && m.crypto && (
                          <p className="text-xs text-text-muted">
                            {m.crypto.asset || 'Crypto'} • {m.crypto.network} •{' '}
                            {m.crypto.address.slice(0, 6)}...{m.crypto.address.slice(-4)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePayoutMethod(m._id)}
                        className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
          <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden mb-8">
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

          {/* Withdrawals History */}
          <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Withdrawals</h2>
                <p className="text-sm text-text-muted">
                  Manual withdrawals processed by the EAZY team
                </p>
              </div>
            </div>

            {withdrawalsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto" />
                <p className="mt-4 text-text-secondary">Loading withdrawals...</p>
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="p-8 text-center">
                <ArrowUpRight className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-text-primary">No withdrawals yet</h3>
                <p className="text-text-secondary mt-1 text-sm">
                  When you request withdrawals, they will appear here with their status.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-default">
                {withdrawals.map((w) => (
                  <div key={w.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-text-primary">{w.amountFormatted}</p>
                      <p className="text-xs text-text-muted">
                        Fee: {w.feeFormatted} • Debited: {w.grossFormatted}
                      </p>
                      {w.payoutMethod && (
                        <p className="text-xs text-text-muted mt-1">
                          {w.payoutMethod.type.toUpperCase()} • {w.payoutMethod.label}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xs font-semibold px-2 py-1 rounded-full inline-block ${
                          w.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : w.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-surface-elevated text-text-secondary border border-border-default'
                        }`}
                      >
                        {w.status.toUpperCase()}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {formatDate(w.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
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

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowWithdrawModal(false)} />
          <div className="relative bg-surface-raised border border-border-default rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in">
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/20 rounded-full mb-4">
                <ArrowUpRight className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Withdraw from Wallet</h2>
              <p className="text-text-secondary text-sm mt-1">
                Minimum ₹1,000 per withdrawal. Fee: 8%.
              </p>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min={1000}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-base border border-border-default text-text-primary rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Payout Method
                </label>
                {payoutMethods.length === 0 ? (
                  <p className="text-xs text-amber-400">
                    You have no payout methods configured. Please contact support to set one up.
                  </p>
                ) : (
                  <select
                    value={selectedPayoutMethodId}
                    onChange={(e) => setSelectedPayoutMethodId(e.target.value as any)}
                    className="w-full px-4 py-3 bg-surface-base border border-border-default text-text-primary rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="default">Default method</option>
                    {payoutMethods.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.label} ({m.type.toUpperCase()})
                        {m.isDefault ? ' • Default' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="bg-surface-elevated rounded-xl p-4 text-sm text-text-secondary space-y-1">
                <p>
                  You will receive the amount in your selected payout method after manual
                  processing by the EAZY team.
                </p>
              </div>
            </div>

            <button
              onClick={handleRequestWithdrawal}
              disabled={
                withdrawLoading ||
                !withdrawAmount ||
                parseInt(withdrawAmount || '0', 10) < 1000 ||
                payoutMethods.length === 0
              }
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
            >
              {withdrawLoading ? 'Requesting...' : 'Request Withdrawal'}
            </button>

            <p className="text-center text-text-muted text-xs mt-4">
              Funds are processed manually. Typical processing time: 1-3 business days.
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
