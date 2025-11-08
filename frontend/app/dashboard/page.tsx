'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import OnboardingModal from '@/components/OnboardingModal';
import Navbar from '@/components/Navbar';

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6">
            Welcome back, {user.email}!
          </h2>

          {/* Store Connection Prompt */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-6 mb-6 border-2 border-primary-600">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🏪</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  Connect Your Shopify Store
                </h3>
                <p className="text-gray-300 mb-4">
                  Connect your Shopify store credentials to start creating and managing products.
                  You can connect multiple stores and switch between them.
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/dashboard/stores/connect"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                  >
                    Connect Store
                  </Link>
                  <Link
                    href="/dashboard/stores"
                    className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors font-medium border-2 border-primary-600"
                  >
                    View My Stores
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Created Stores */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold mb-4 text-white">Your Created Stores</h3>
            {user.stores && user.stores.length > 0 ? (
              <div className="space-y-4">
                {user.stores.map((store, index) => (
                  <div
                    key={index}
                    className="border border-gray-700 bg-gray-800 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-white">
                          {store.productName || 'Store'}
                        </h4>
                        <a
                          href={store.storeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-400 hover:text-primary-300 text-sm"
                        >
                          {store.storeUrl}
                        </a>
                        <p className="text-sm text-gray-400 mt-1">
                          Created: {new Date(store.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={store.storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Visit Store
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-300 mb-4">
                  You haven't created any stores yet
                </p>
                <Link
                  href="/products"
                  className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-white">Quick Actions</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Link
                href="/products"
                className="border-2 border-gray-700 hover:border-primary-500 bg-gray-800 rounded-lg p-4 transition-colors"
              >
                <div className="text-2xl mb-2">🛍️</div>
                <h4 className="font-semibold text-white mb-1">
                  Browse Products
                </h4>
                <p className="text-sm text-gray-400">
                  Find products to add to your store
                </p>
              </Link>

              <Link
                href="/dashboard/stores"
                className="border-2 border-gray-700 hover:border-primary-500 bg-gray-800 rounded-lg p-4 transition-colors"
              >
                <div className="text-2xl mb-2">🔗</div>
                <h4 className="font-semibold text-white mb-1">
                  Manage Stores
                </h4>
                <p className="text-sm text-gray-400">
                  Connect and manage your Shopify stores
                </p>
              </Link>

              <div className="border-2 border-gray-700 hover:border-gray-600 bg-gray-800 rounded-lg p-4 transition-colors cursor-pointer opacity-50">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-semibold text-white mb-1">
                  View Analytics
                </h4>
                <p className="text-sm text-gray-400">
                  Coming soon
                </p>
              </div>
            </div>
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
