'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import ConfirmModal from '@/components/ConfirmModal';
import IconBadge from '@/components/IconBadge';
import SubscriptionLock from '@/components/SubscriptionLock';
import { useStoreSubscription } from '@/hooks/useStoreSubscription';
import { Store, ShoppingBag, ExternalLink } from 'lucide-react';

interface InternalStore {
  _id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  currency: string;
  razorpayAccountStatus?: string;
  createdAt: string;
}

export default function MyStoresPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { hasActiveStoreSubscription, loading: subscriptionLoading } = useStoreSubscription();
  const router = useRouter();
  const [internalStore, setInternalStore] = useState<InternalStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStores = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      
      // Fetch internal store
      try {
        const internalResponse = await api.getMyStore();
        if (internalResponse.success && internalResponse.data) {
          setInternalStore(internalResponse.data);
        } else {
          setInternalStore(null);
        }
      } catch (internalError: any) {
        // Internal store might not exist, that's okay
        setInternalStore(null);
      }
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      setError(error.response?.data?.error || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Check store subscription before rendering
  if (!authLoading && !subscriptionLoading && isAuthenticated && !hasActiveStoreSubscription) {
    return <SubscriptionLock featureName="My Stores" planType="stores" />;
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">My Store</h1>
              <p className="mt-2 text-text-secondary">
                Manage your internal store
              </p>
            </div>
            <div className="flex gap-3">
              {!internalStore && (
                <Link
                  href="/dashboard/store/create"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition-all font-medium shadow-lg shadow-purple-500/25"
                >
                  + Create Store
                </Link>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Store Display */}
          {!internalStore ? (
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-12 text-center space-y-4">
              <div className="flex justify-center">
                <IconBadge label="No store" icon={Store} size="lg" variant="neutral" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No store yet
              </h3>
              <p className="text-text-secondary mb-6">
                Create your store to get started
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/dashboard/store/create"
                  className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition-all font-medium shadow-lg shadow-purple-500/25"
                >
                  Create Store
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {/* Internal Store */}
              {internalStore && (
                <div
                  className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 border-2 border-purple-500/30 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-gradient-to-br from-purple-600 to-blue-600 text-white px-3 py-1 rounded-bl-lg text-xs font-semibold">
                    INTERNAL STORE
                  </div>
                  <div className="flex items-start justify-between mt-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-text-primary">
                            {internalStore.name}
                          </h3>
                          <p className="text-sm text-text-secondary mt-1">
                            {internalStore.slug}.eazyds.com
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          internalStore.status === 'active'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {internalStore.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-text-secondary ml-16">
                        <p>
                          <span className="font-medium">Currency:</span> {internalStore.currency}
                        </p>
                        <p>
                          <span className="font-medium">Payment:</span>{' '}
                          {internalStore.razorpayAccountStatus === 'active' ? (
                            <span className="text-green-400">Connected</span>
                          ) : (
                            <span className="text-yellow-400">Not Connected</span>
                          )}
                        </p>
                        <p>
                          <span className="font-medium">Created:</span>{' '}
                          {new Date(internalStore.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Link
                        href="/dashboard/store/overview"
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-sm font-medium text-center transition-all shadow-lg shadow-purple-500/25"
                      >
                        Manage Store
                      </Link>
                      <a
                        href={`https://${internalStore.slug}.eazyds.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-surface-hover hover:bg-surface-elevated text-text-primary rounded-lg text-sm font-medium text-center transition-colors flex items-center justify-center gap-1"
                      >
                        View Store
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
