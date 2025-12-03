'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { notify } from '@/lib/toast';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  History,
  X,
  ChevronRight,
} from 'lucide-react';

interface WalletData {
  balance: number;
  balanceFormatted: string;
  currency: string;
  autoRechargeEnabled: boolean;
  autoRechargeAmount: number | null;
  minAutoRechargeThreshold: number;
}

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TOPUP_AMOUNTS = [
  { value: 50000, label: '₹500' },
  { value: 100000, label: '₹1,000' },
  { value: 200000, label: '₹2,000' },
  { value: 500000, label: '₹5,000' },
  { value: 1000000, label: '₹10,000' },
];

function TopupModal({ isOpen, onClose, onSuccess }: TopupModalProps) {
  const [amount, setAmount] = useState<number>(100000); // Default ₹1,000
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTopup = async () => {
    const topupAmount = isCustom ? parseInt(customAmount) * 100 : amount; // Convert rupees to paise

    if (!topupAmount || topupAmount < 10000) {
      notify.error('Minimum topup amount is ₹100');
      return;
    }

    if (topupAmount > 10000000) {
      notify.error('Maximum topup amount is ₹1,00,000');
      return;
    }

    try {
      setLoading(true);

      // Create topup order
      const orderResponse = await api.createWalletTopupOrder(topupAmount);
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error('Failed to create topup order');
      }

      const { orderId, amount: orderAmount, currency, keyId } = orderResponse.data;

      // Open Razorpay checkout
      await openRazorpayCheckout(
        {
          key: keyId,
          amount: orderAmount,
          currency,
          name: 'EAZY DROPSHIPPING',
          description: 'Wallet Top-up',
          order_id: orderId,
          theme: {
            color: '#22c55e',
          },
        },
        async (response) => {
          try {
            // Verify payment
            const verifyResponse = await api.verifyWalletTopup({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.success) {
              notify.success(`${verifyResponse.data.amountFormatted} added to wallet!`);
              onSuccess();
              onClose();
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error: any) {
            notify.error(error?.message || 'Payment verification failed');
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          notify.error(error?.message || 'Payment cancelled');
          setLoading(false);
        }
      );
    } catch (error: any) {
      notify.error(error?.response?.data?.error || error?.message || 'Failed to initiate topup');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface-raised border border-border-default rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in">
        <button
          onClick={onClose}
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

        {/* Preset Amounts */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {TOPUP_AMOUNTS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => {
                setAmount(preset.value);
                setIsCustom(false);
              }}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                !isCustom && amount === preset.value
                  ? 'bg-emerald-500 text-black'
                  : 'bg-surface-elevated border border-border-default text-text-primary hover:border-emerald-500/50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Amount */}
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
                className="w-full pl-8 pr-4 py-3 bg-surface-base border border-border-default text-text-primary rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                min="100"
                max="100000"
              />
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-surface-elevated rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Amount to add</span>
            <span className="text-xl font-bold text-emerald-400">
              ₹{((isCustom ? parseInt(customAmount) * 100 || 0 : amount) / 100).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Add Money Button */}
        <button
          onClick={handleTopup}
          disabled={loading || (isCustom && (!customAmount || parseInt(customAmount) < 100))}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
        >
          {loading ? 'Processing...' : 'Add Money'}
        </button>

        <p className="text-center text-text-muted text-xs mt-4">
          Secured by Razorpay. Min ₹100, Max ₹1,00,000
        </p>
      </div>

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

interface WalletWidgetProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export default function WalletWidget({ variant = 'compact', className = '' }: WalletWidgetProps) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopupModal, setShowTopupModal] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleTopupSuccess = () => {
    fetchWallet();
  };

  if (loading) {
    return (
      <div className={`bg-surface-raised border border-border-default rounded-xl p-4 ${className}`}>
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-elevated rounded-lg" />
          <div className="flex-1">
            <div className="h-4 w-20 bg-surface-elevated rounded mb-2" />
            <div className="h-6 w-28 bg-surface-elevated rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <div
          className={`bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-4 ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-emerald-400/70 font-medium uppercase tracking-wide">
                  Wallet Balance
                </p>
                <p className="text-xl font-bold text-emerald-400">
                  {wallet?.balanceFormatted || '₹0.00'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTopupModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
              <Link
                href="/dashboard/wallet"
                className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
                title="View transactions"
              >
                <History className="w-5 h-5 text-text-secondary" />
              </Link>
            </div>
          </div>
        </div>

        <TopupModal
          isOpen={showTopupModal}
          onClose={() => setShowTopupModal(false)}
          onSuccess={handleTopupSuccess}
        />
      </>
    );
  }

  // Full variant
  return (
    <>
      <div
        className={`bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl overflow-hidden ${className}`}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-emerald-400/70 font-medium uppercase tracking-wide">
                  Wallet Balance
                </p>
                <p className="text-3xl font-bold text-emerald-400">
                  {wallet?.balanceFormatted || '₹0.00'}
                </p>
              </div>
            </div>
            <button
              onClick={fetchWallet}
              className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          <button
            onClick={() => setShowTopupModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Money
          </button>
        </div>

        <Link
          href="/dashboard/wallet"
          className="flex items-center justify-between px-6 py-4 bg-surface-elevated/50 hover:bg-surface-elevated transition-colors border-t border-emerald-500/20"
        >
          <div className="flex items-center gap-2 text-text-secondary">
            <History className="w-4 h-4" />
            <span className="text-sm font-medium">View Transaction History</span>
          </div>
          <ChevronRight className="w-5 h-5 text-text-muted" />
        </Link>
      </div>

      <TopupModal
        isOpen={showTopupModal}
        onClose={() => setShowTopupModal(false)}
        onSuccess={handleTopupSuccess}
      />
    </>
  );
}

