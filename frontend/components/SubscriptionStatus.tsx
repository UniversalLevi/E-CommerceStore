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
      <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'expired':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
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
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Subscription Status</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
            subscription.status
          )}`}
        >
          {getStatusText(subscription.status)}
        </span>
      </div>

      {subscription.status === 'active' && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Product Usage</span>
              <span className="text-white font-medium">{formatProductUsage()}</span>
            </div>
            {subscription.maxProducts !== null && (
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${getUsagePercentage()}%` }}
                ></div>
              </div>
            )}
          </div>

          {subscription.planExpiresAt && !subscription.isLifetime && (
            <div className="text-sm text-gray-400 mb-4">
              Expires: {new Date(subscription.planExpiresAt).toLocaleDateString()}
            </div>
          )}

          {subscription.isLifetime && (
            <div className="text-sm text-green-400 mb-4">Lifetime Plan</div>
          )}
        </>
      )}

      {subscription.status !== 'active' && (
        <div className="mb-4">
          <p className="text-gray-400 text-sm mb-3">
            {subscription.status === 'expired'
              ? 'Your subscription has expired. Upgrade to continue adding products.'
              : 'No active subscription. Choose a plan to get started.'}
          </p>
          <Link
            href="/dashboard/billing"
            className="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {subscription.status === 'expired' ? 'Renew Plan' : 'Choose Plan'}
          </Link>
        </div>
      )}
    </div>
  );
}

