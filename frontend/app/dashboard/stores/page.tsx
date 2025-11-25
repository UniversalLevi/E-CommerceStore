'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import ConfirmModal from '@/components/ConfirmModal';

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

export default function MyStoresPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<StoreConnection[]>([]);
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

  const fetchStores = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: StoreConnection[] }>(
        '/api/stores'
      );
      setStores(response.data);
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
      notify.success(response.message);
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

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.invalid}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
                Manage your connected Shopify stores
              </p>
            </div>
            <Link
              href="/dashboard/stores/connect"
              className="bg-primary-500 hover:bg-primary-600 text-black px-6 py-3 rounded-lg transition-colors font-medium"
            >
              + Connect New Store
            </Link>
          </div>

          {error && (
            <div className="mb-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Stores Grid */}
          {stores.length === 0 ? (
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No stores connected yet
              </h3>
              <p className="text-text-secondary mb-6">
                Connect your first Shopify store to start creating products
              </p>
              <Link
                href="/dashboard/stores/connect"
                className="inline-block bg-primary-500 hover:bg-primary-600 text-black px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Connect Your First Store
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {stores.map((store) => (
                <div
                  key={store._id}
                  className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-text-primary">
                          {store.storeName}
                        </h3>
                        {getStatusBadge(store.status)}
                        {store.isDefault && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-500 text-black">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-text-secondary">
                        <p>
                          <span className="font-medium">Domain:</span>{' '}
                          <a
                            href={`https://${store.shopDomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-500 hover:underline"
                          >
                            {store.shopDomain}
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
