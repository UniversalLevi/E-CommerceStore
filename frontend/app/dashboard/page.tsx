'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import OnboardingModal from '@/components/OnboardingModal';
import SubscriptionStatus from '@/components/SubscriptionStatus';
import IconBadge from '@/components/IconBadge';
import { Link2, ShoppingBag, Store, BarChart3, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading, logout, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [internalStore, setInternalStore] = useState<any | null>(null);
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
      // Fetch stores (internal stores)
      const response = await api.get<{ success: boolean; data: any[] }>('/api/stores');
      setStores(response.data);
      
      // Fetch internal store
      try {
        const internalResponse = await api.getMyStore();
        if (internalResponse.success && internalResponse.data) {
          setInternalStore(internalResponse.data);
        }
      } catch (internalError: any) {
        // Internal store might not exist, that's okay
        setInternalStore(null);
      }
    } catch (error) {
      // Ignore errors
    }
  };

  const checkOnboarding = () => {
    // Check if user has completed onboarding
    if (!user?.onboarding) {
      setShowOnboarding(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-purple-500 border-r-blue-500 mx-auto"></div>
          </div>
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

          {/* Onboarding Status */}
          {user.onboarding ? (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 md:p-6 mb-4 md:mb-6 border border-green-500/30">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-text-primary mb-2">
                    Onboarding Completed
                  </h3>
                  <p className="text-sm md:text-base text-text-secondary">
                    You have already completed the onboarding process. Your preferences have been saved.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-4 md:p-6 mb-4 md:mb-6 border border-purple-500/30">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <IconBadge icon={Link2} label="Onboarding" size="md" variant="primary" className="mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-text-primary mb-2">
                    Complete Your Onboarding
                  </h3>
                  <p className="text-sm md:text-base text-text-secondary mb-4">
                    Complete the onboarding process to personalize your experience and get product recommendations tailored to your needs.
                  </p>
                  <button
                    onClick={() => setShowOnboarding(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-4 md:px-6 py-2 rounded-lg transition-all font-medium shadow-lg shadow-purple-500/20"
                  >
                    Complete Onboarding
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Connected Stores */}
          {(stores.length > 0 || internalStore) ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-text-primary flex items-center gap-2">
                <Store className="w-5 h-5" />
                Your Stores
              </h3>
              <div className="space-y-3">
                {/* Stores */}
                {stores.map((store) => (
                  <div
                    key={store._id}
                    className="border border-white/10 bg-white/5 rounded-lg p-4 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-text-primary">{store.name || store.storeName}</h4>
                          {store.status === 'active' ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/40">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                              {store.status}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary mt-1">{store.shopDomain}</p>
                      </div>
                      <Link
                        href={`/dashboard/stores/${store._id}`}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all text-sm"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                ))}
                
                {/* Internal Store */}
                {internalStore && (
                  <div className="border border-white/10 bg-white/5 rounded-lg p-4 hover:border-purple-500/30 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-text-primary">{internalStore.name}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            Internal Store
                          </span>
                          {internalStore.status === 'active' ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/40">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                              {internalStore.status}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary mt-1">
                          {process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://'}{internalStore.slug}.{process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN || 'eazydropshipping.com'}
                        </p>
                      </div>
                      <Link
                        href="/dashboard/store"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all text-sm"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <Link
                  href="/dashboard/stores"
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View All Stores →
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-4 md:p-6 mb-4 md:mb-6 border border-purple-500/30">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <IconBadge icon={Link2} label="Store connection" size="md" variant="primary" className="mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-text-primary mb-2">
                    Create Your Store
                  </h3>
                  <p className="text-sm md:text-base text-text-secondary mb-4">
                    Create your store to start adding and managing products.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/dashboard/stores/connect"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-4 md:px-6 py-2 rounded-lg transition-all font-medium text-center min-h-[44px] flex items-center justify-center shadow-lg shadow-purple-500/20"
                    >
                      Connect Store
                    </Link>
                    <Link
                      href="/dashboard/stores"
                      className="bg-white/5 hover:bg-white/10 text-text-primary px-4 md:px-6 py-2 rounded-lg transition-colors font-medium border border-white/20 hover:border-purple-500/50 text-center min-h-[44px] flex items-center justify-center"
                    >
                      View My Stores
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Created Stores */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-text-primary">Your Created Stores</h3>
            {user.stores && user.stores.length > 0 ? (
              <div className="space-y-4">
                {user.stores.map((store, index) => (
                  <div
                    key={index}
                    className="border border-white/10 bg-white/5 rounded-lg p-4 hover:border-purple-500/30 transition-colors"
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
                          className="text-text-primary hover:text-purple-400 text-sm transition-colors"
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
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all"
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
                  className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-purple-500/20"
                >
                  Browse Products
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-text-primary">Quick Actions</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <Link
                href="/products"
                className="border border-white/10 hover:border-purple-500/50 bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-all group"
              >
                <IconBadge icon={ShoppingBag} label="Browse products" size="sm" className="mb-2" />
                <h4 className="font-semibold text-text-primary mb-1 group-hover:text-purple-400 transition-colors">
                  Browse Products
                </h4>
                <p className="text-sm text-text-secondary">
                  Find products to add to your store
                </p>
              </Link>

              <Link
                href="/dashboard/stores"
                className="border border-white/10 hover:border-purple-500/50 bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-all group"
              >
                <IconBadge icon={Store} label="Manage stores" size="sm" variant="primary" className="mb-2" />
                <h4 className="font-semibold text-text-primary mb-1 group-hover:text-purple-400 transition-colors">
                  Manage Stores
                </h4>
                <p className="text-sm text-text-secondary">
                  Create and manage your stores
                </p>
              </Link>

              <Link
                href="/dashboard/analytics"
                className="border border-white/10 hover:border-purple-500/50 bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-all group"
              >
                <IconBadge icon={BarChart3} label="View analytics" size="sm" variant="success" className="mb-2" />
                <h4 className="font-semibold text-text-primary mb-1 group-hover:text-purple-400 transition-colors">
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
          // Modal cannot be closed if onboarding is not completed
          if (user?.onboarding) {
            setShowOnboarding(false);
          }
        }}
        onComplete={async () => {
          setShowOnboarding(false);
          // Refresh user data to get updated onboarding status
          await refreshUser();
        }}
      />

    </div>
  );
}
