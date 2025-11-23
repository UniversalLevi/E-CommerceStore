'use client';

import { SubscriptionInfo } from '@/types';
import Link from 'next/link';

interface ProductLimitWarningProps {
  subscription: SubscriptionInfo | null;
  showWarning?: boolean; // Show warning when approaching limit (default: 80%)
}

export default function ProductLimitWarning({
  subscription,
  showWarning = true,
}: ProductLimitWarningProps) {
  if (!subscription || subscription.status !== 'active') {
    return null;
  }

  if (subscription.maxProducts === null) {
    // Unlimited plan - no warning needed
    return null;
  }

  const usagePercentage = (subscription.productsAdded / subscription.maxProducts) * 100;
  const remaining = subscription.maxProducts - subscription.productsAdded;
  const isAtLimit = remaining === 0;
  const isNearLimit = showWarning && usagePercentage >= 80 && !isAtLimit;

  if (!isAtLimit && !isNearLimit) {
    return null;
  }

  return (
    <div
      className={`rounded-lg p-4 mb-4 border ${
        isAtLimit
          ? 'bg-red-500/20 border-red-500/50'
          : 'bg-yellow-500/20 border-yellow-500/50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4
            className={`font-semibold mb-1 ${
              isAtLimit ? 'text-red-400' : 'text-yellow-400'
            }`}
          >
            {isAtLimit ? 'Product Limit Reached' : 'Approaching Product Limit'}
          </h4>
          <p className="text-gray-300 text-sm mb-3">
            {isAtLimit
              ? `You've reached your limit of ${subscription.maxProducts} products. Upgrade to add more products.`
              : `You've used ${subscription.productsAdded} of ${subscription.maxProducts} products. Only ${remaining} remaining.`}
          </p>
          <Link
            href="/dashboard/billing"
            className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isAtLimit
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            {isAtLimit ? 'Upgrade Plan' : 'Upgrade Now'}
          </Link>
        </div>
      </div>
    </div>
  );
}

