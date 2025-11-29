'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import OnboardingModal from '@/components/OnboardingModal';
import SubscriptionStatus from '@/components/SubscriptionStatus';
import IconBadge from '@/components/IconBadge';
import { Link2, ShoppingBag, Store, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      checkOnboarding();
      fetchStores();
    }
  }, [isAuthenticated, user]);

  const fetchStores = async () => {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>('/api/stores');
      setStores(response.data);
    } catch (error) {
      // Ignore errors
    }
  };

  const checkOnboarding = () => {
    const dismissed = localStorage.getItem('onboarding_dismissed');
    if (!dismissed && stores.length === 0) {
      setShowOnboarding(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      {/* Dashboard Content */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4 md:mb-6">
            Welcome back, {user.email}!
          </h2>

          {/* Subscription Status */}
          <div className="mb-6">
            <SubscriptionStatus />
          </div>

          {/* Store Connection Prompt */}
          <div className="bg-gradient-to-r from-surface-raised to-surface-hover rounded-xl p-4 md:p-6 mb-4 md:mb-6 border-2 border-primary-500">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <IconBadge icon={Link2} label="Store connection" size="md" variant="primary" className="mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold text-text-primary mb-2">
                  Connect Your Shopify Store
                </h3>
                <p className="text-sm md:text-base text-text-secondary mb-4">
                  Connect your Shopify store credentials to start creating and managing products.
                  You can connect multiple stores and switch between them.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/dashboard/stores/connect"
                    className="bg-primary-500 hover:bg-primary-600 text-black px-4 md:px-6 py-2 rounded-lg transition-colors font-medium text-center min-h-[44px] flex items-center justify-center"
                  >
                    Connect Store
                  </Link>
                  <Link
                    href="/dashboard/stores"
                    className="bg-surface-raised hover:bg-surface-hover text-text-primary px-4 md:px-6 py-2 rounded-lg transition-colors font-medium border-2 border-primary-500 text-center min-h-[44px] flex items-center justify-center"
                  >
                    View My Stores
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Created Stores */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-text-primary">Your Created Stores</h3>
            {user.stores && user.stores.length > 0 ? (
              <div className="space-y-4">
                {user.stores.map((store, index) => (
                  <div
                    key={index}
                    className="border border-border-default bg-surface-elevated rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-text-primary">
                          {store.productName || 'Store'}
                        </h4>
                        <a
                          href={store.storeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-primary hover:text-primary-500 text-sm"
                        >
                          {store.storeUrl}
                        </a>
                        <p className="text-sm text-text-secondary mt-1">
                          Created: {new Date(store.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={store.storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary-500 text-black px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        Visit Store
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-text-secondary mb-4">
                  You haven't created any stores yet
                </p>
                <Link
                  href="/products"
                  className="inline-block bg-primary-500 hover:bg-primary-600 text-black px-6 py-3 rounded-lg transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-text-primary">Quick Actions</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <Link
                href="/products"
                className="border-2 border-border-default hover:border-primary-500 bg-surface-elevated rounded-lg p-4 transition-colors"
              >
                <IconBadge icon={ShoppingBag} label="Browse products" size="sm" className="mb-2" />
                <h4 className="font-semibold text-text-primary mb-1">
                  Browse Products
                </h4>
                <p className="text-sm text-text-secondary">
                  Find products to add to your store
                </p>
              </Link>

              <Link
                href="/dashboard/stores"
                className="border-2 border-border-default hover:border-primary-500 bg-surface-elevated rounded-lg p-4 transition-colors"
              >
                <IconBadge icon={Store} label="Manage stores" size="sm" variant="primary" className="mb-2" />
                <h4 className="font-semibold text-text-primary mb-1">
                  Manage Stores
                </h4>
                <p className="text-sm text-text-secondary">
                  Connect and manage your Shopify stores
                </p>
              </Link>

              <Link
                href="/dashboard/analytics"
                className="border-2 border-border-default hover:border-primary-500 bg-surface-elevated rounded-lg p-4 transition-colors"
              >
                <IconBadge icon={BarChart3} label="View analytics" size="sm" variant="success" className="mb-2" />
                <h4 className="font-semibold text-text-primary mb-1">
                  View Analytics
                </h4>
                <p className="text-sm text-text-secondary">
                  Track your store performance
                </p>
              </Link>
            </div>
          </div>
        </div>

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem('onboarding_dismissed', 'true');
        }}
        onComplete={() => {
          setShowOnboarding(false);
        }}
      />

    </div>
  );
}
