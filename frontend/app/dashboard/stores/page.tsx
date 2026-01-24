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
import { useSubscription } from '@/hooks/useSubscription';
import { Store, ShoppingBag, ExternalLink } from 'lucide-react';

interface StoreConnection {
  _id: string;
  storeName: string;
  shopDomain: string;
  environment: string;
  isDefault: boolean;
  status: 'active' | 'invalid' | 'revoked';
  lastTestedAt?: string;
  lastTestResult?: string;
  createdAt: string;
}

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
  const { hasActiveSubscription } = useSubscription();
  const router = useRouter();
  const [stores, setStores] = useState<StoreConnection[]>([]);
  const [internalStore, setInternalStore] = useState<InternalStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; storeId: string; storeName: string }>({
    isOpen: false,
    storeId: '',
    storeName: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Check subscription before rendering
  if (!authLoading && isAuthenticated && !hasActiveSubscription) {
    return <SubscriptionLock featureName="My Stores" />;
  }

  const fetchStores = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      
      // Fetch Shopify stores
      const shopifyResponse = await api.get<{ success: boolean; data: StoreConnection[] }>(
        '/api/stores'
      );
      setStores(shopifyResponse.data);
      
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
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      setError(error.response?.data?.error || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleTest = async (storeId: string) => {
    setTesting(storeId);
    try {
      const response = await api.post<{ success: boolean; valid: boolean; message: string }>(
        `/api/stores/${storeId}/test`
      );
      if (response.valid) {
        notify.success(response.message);
      } else {
        notify.error(response.message || 'Connection test failed');
      }
      await fetchStores(); // Refresh to get updated status
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to test connection');
    } finally {
      setTesting(null);
    }
  };

  const handleSetDefault = async (storeId: string) => {
    try {
      await api.put(`/api/stores/${storeId}/default`);
      
      // Optimistic update
      setStores(prevStores => prevStores.map(store => ({
        ...store,
        isDefault: store._id === storeId
      })));
      notify.success('Default store updated');
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to set default');
      await fetchStores(); // Revert on error
    }
  };

  const handleDeleteClick = (storeId: string, storeName: string) => {
    setDeleteModal({ isOpen: true, storeId, storeName });
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/stores/${deleteModal.storeId}`);
      
      // Optimistic update
      setStores(prevStores => prevStores.filter(store => store._id !== deleteModal.storeId));
      notify.success('Store deleted successfully');
      setDeleteModal({ isOpen: false, storeId: '', storeName: '' });
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to delete store');
      await fetchStores(); // Revert on error
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-900 text-green-200',
      invalid: 'bg-red-900 text-red-200',
      revoked: 'bg-gray-700 text-gray-300',
    };

    const safeStatus = status || 'invalid';
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[safeStatus as keyof typeof colors] || colors.invalid}`}>
        {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
      </span>
    );
  };

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
              <h1 className="text-3xl font-bold text-text-primary">My Stores</h1>
              <p className="mt-2 text-text-secondary">
                Manage your internal store and connected Shopify stores
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard/store/create"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition-all font-medium shadow-lg shadow-purple-500/25"
              >
                + Create Internal Store
              </Link>
              <Link
                href="/dashboard/stores/connect"
                className="bg-primary-500 hover:bg-primary-600 text-black px-6 py-3 rounded-lg transition-colors font-medium"
              >
                + Connect Shopify Store
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Stores Grid */}
          {stores.length === 0 && !internalStore ? (
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-12 text-center space-y-4">
              <div className="flex justify-center">
                <IconBadge label="No stores" icon={Store} size="lg" variant="neutral" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No stores yet
              </h3>
              <p className="text-text-secondary mb-6">
                Create an internal store or connect a Shopify store to get started
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/dashboard/store/create"
                  className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition-all font-medium shadow-lg shadow-purple-500/25"
                >
                  Create Internal Store
                </Link>
                <Link
                  href="/dashboard/stores/connect"
                  className="inline-block bg-primary-500 hover:bg-primary-600 text-black px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Connect Shopify Store
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
                            {internalStore.slug}.eazydropshipping.com
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
                        href={`/storefront/${internalStore.slug}`}
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

              {/* Shopify Stores Section */}
              {stores.length > 0 && (
                <>
                  {internalStore && (
                    <div className="mt-4 mb-2">
                      <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Shopify Stores
                      </h2>
                      <p className="text-sm text-text-secondary mt-1">
                        Connected Shopify store connections
                      </p>
                    </div>
                  )}
                  {stores.map((store) => (
                <div
                  key={store._id}
                  className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow relative"
                >
                  <div className="absolute top-0 right-0 bg-primary-500/20 text-primary-300 px-3 py-1 rounded-bl-lg text-xs font-semibold">
                    SHOPIFY
                  </div>
                  <div className="flex items-start justify-between mt-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
                          <Store className="h-6 w-6 text-primary-300" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-text-primary">
                            {store.storeName}
                          </h3>
                        </div>
                        {getStatusBadge(store.status)}
                        {store.isDefault && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-500 text-black">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-text-secondary ml-16">
                        <p>
                          <span className="font-medium">Domain:</span>{' '}
                          <a
                            href={`https://${store.shopDomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-500 hover:underline flex items-center gap-1"
                          >
                            {store.shopDomain}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </p>
                        <p>
                          <span className="font-medium">Environment:</span>{' '}
                          {store.environment}
                        </p>
                        {store.lastTestedAt && (
                          <p>
                            <span className="font-medium">Last Tested:</span>{' '}
                            {new Date(store.lastTestedAt).toLocaleString()}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Connected:</span>{' '}
                          {new Date(store.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleTest(store._id)}
                        disabled={testing === store._id}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-black rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {testing === store._id ? 'Testing...' : 'Test Connection'}
                      </button>

                      {!store.isDefault && (
                        <button
                          onClick={() => handleSetDefault(store._id)}
                          className="px-4 py-2 bg-surface-hover hover:bg-surface-elevated text-text-primary rounded-lg text-sm font-medium transition-colors"
                        >
                          Set as Default
                        </button>
                      )}

                      <Link
                        href={`/dashboard/stores/${store._id}/edit`}
                        className="px-4 py-2 bg-surface-hover hover:bg-surface-elevated text-text-primary rounded-lg text-sm font-medium text-center transition-colors"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => handleDeleteClick(store._id, store.storeName)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Store"
        message={`Are you sure you want to delete "${deleteModal.storeName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, storeId: '', storeName: '' })}
      />
    </div>
  );
}
