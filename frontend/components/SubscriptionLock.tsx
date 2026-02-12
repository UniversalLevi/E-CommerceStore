'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';
import Button from './Button';

interface SubscriptionLockProps {
  featureName: string;
  planType?: 'eazyds' | 'stores';
}

export default function SubscriptionLock({ featureName, planType = 'eazyds' }: SubscriptionLockProps) {
  const router = useRouter();
  
  const billingUrl = planType === 'stores' ? '/dashboard/stores/billing' : '/dashboard/billing';

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-surface-base">
      <div className="max-w-md w-full mx-auto p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500/20 blur-2xl rounded-full"></div>
            <div className="relative bg-surface-raised border border-border-default rounded-full p-6">
              <Lock className="h-12 w-12 text-primary-500" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-text-primary mb-3">
          Subscription Required
        </h2>
        
        <p className="text-text-secondary mb-2">
          {featureName} is only available with an active subscription.
        </p>
        
        <p className="text-text-muted text-sm mb-8">
          Upgrade your plan to unlock this feature and many more.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => router.push(billingUrl)}
            className="w-full"
            variant="primary"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            View Plans & Upgrade
          </Button>
          
          <Button
            onClick={() => router.push('/dashboard')}
            variant="secondary"
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-border-default">
          <p className="text-text-muted text-xs">
            Need help?{' '}
            <Link href="/contact" className="text-primary-500 hover:text-primary-400 underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

