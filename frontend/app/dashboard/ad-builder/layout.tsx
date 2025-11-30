'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionLock from '@/components/SubscriptionLock';

export default function AdBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { hasActiveSubscription } = useSubscription();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Lock entire ad-builder section if no subscription
  if (!authLoading && isAuthenticated && !hasActiveSubscription) {
    return <SubscriptionLock featureName="Ad Builder" />;
  }

  return <>{children}</>;
}

