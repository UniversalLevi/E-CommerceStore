'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { SubscriptionInfo } from '@/types';
import Link from 'next/link';

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await api.getCurrentPlan();
      if (response.success) {
        setSubscription(response.data);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-purple-500/10 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-purple-500/10 rounded w-1/2"></div>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent shadow-lg shadow-purple-500/20';
      case 'trialing':
        return 'bg-gradient-to-r from-green-600 to-teal-600 text-white border-transparent shadow-lg shadow-green-500/20';
      case 'expired':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-white/10 text-text-secondary border-white/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial Active';
      case 'expired':
        return 'Expired';
      default:
        return 'No Plan';
    }
  };

  const formatProductUsage = () => {
    if (subscription.maxProducts === null) {
      return `${subscription.productsAdded} products (Unlimited)`;
    }
    return `${subscription.productsAdded} / ${subscription.maxProducts} products`;
  };

  const getUsagePercentage = () => {
    if (subscription.maxProducts === null) return 0;
    return Math.min(100, (subscription.productsAdded / subscription.maxProducts) * 100);
  };

  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Subscription Status</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
            subscription.status
          )}`}
        >
          {getStatusText(subscription.status)}
        </span>
      </div>

      {(subscription.status === 'active' || subscription.status === 'trialing') && (
        <>
          {subscription.status === 'trialing' && subscription.trialEndsAt && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-400 font-semibold">Trial Active</span>
                <span className="text-text-secondary">
                  Ends: {new Date(subscription.trialEndsAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Full amount will be auto-debited after trial ends
              </p>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-text-secondary">Product Usage</span>
              <span className="text-text-primary font-medium">{formatProductUsage()}</span>
            </div>
            {subscription.maxProducts !== null && (
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${getUsagePercentage()}%` }}
                ></div>
              </div>
            )}
          </div>

          {subscription.planExpiresAt && !subscription.isLifetime && (
            <div className="text-sm text-text-secondary mb-4">
              {subscription.status === 'trialing' ? 'Trial ends' : 'Expires'}: {new Date(subscription.planExpiresAt).toLocaleDateString()}
            </div>
          )}

          {subscription.isLifetime && (
            <div className="text-sm text-purple-400 mb-4">✨ Lifetime Plan</div>
          )}
        </>
      )}

      {subscription.status !== 'active' && subscription.status !== 'trialing' && (
        <div className="mb-4">
          <p className="text-text-secondary text-sm mb-3">
            {subscription.status === 'expired'
              ? 'Your subscription has expired. Upgrade to continue adding products.'
              : 'No active subscription. Choose a plan to get started.'}
          </p>
          <Link
            href="/dashboard/billing"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-purple-500/20"
          >
            {subscription.status === 'expired' ? 'Renew Plan' : 'Choose Plan'}
          </Link>
        </div>
      )}
    </div>
  );
}

