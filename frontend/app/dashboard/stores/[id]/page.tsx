'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import Button from '@/components/Button';
import ConfirmModal from '@/components/ConfirmModal';

interface StoreConnection {
  _id: string;
  storeName: string;
  shopDomain: string;
  storeUrl: string;
  environment: string;
  isDefault: boolean;
  status: string;
  lastTestedAt?: string;
  lastTestResult?: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    productCount: number;
  };
  recentActivity: Array<{
    action: string;
    success: boolean;
    timestamp: string;
    details?: any;
  }>;
}

export default function StoreDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [store, setStore] = useState<StoreConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && params.id) {
      fetchStore();
    }
  }, [isAuthenticated, params.id]);

  const fetchStore = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: StoreConnection }>(
        `/api/stores/${params.id}`
      );
      setStore(response.data);
    } catch (err: any) {
      setError('Failed to load store details');
      notify.error('Failed to load store details');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const response = await api.post<{
        success: boolean;
        valid: boolean;
        message: string;
      }>(`/api/stores/${params.id}/test`);

      if (response.valid) {
        notify.success('Store connection is valid!');
      } else {
        notify.error(response.message || 'Connection test failed');
      }
      fetchStore(); // Refresh store data
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to test connection');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/stores/${params.id}`);
      notify.success('Store deleted successfully');
      router.push('/dashboard/stores');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to delete store');
    }
  };

  const handleSetDefault = async () => {
    try {
      await api.put(`/api/stores/${params.id}/default`);
      notify.success('Store set as default');
      fetchStore();
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to set default store');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-base">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !store) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/stores"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            ← Back to Stores
          </Link>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Store Header */}
        <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-text-primary">{store.storeName}</h1>
                {store.isDefault && (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-secondary-500/20 text-secondary-400 border border-secondary-500/50">
                    Default
                  </span>
                )}
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    store.status === 'active'
                      ? 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/50'
                      : store.status === 'invalid'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                      : 'bg-accent-500/20 text-accent-400 border border-accent-500/50'
                  }`}
                >
                  {store.status}
                </span>
              </div>
              <p className="text-text-secondary">{store.shopDomain}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleTestConnection}
                loading={testing}
                variant="secondary"
              >
                Test Connection
              </Button>
              <Link href={`/dashboard/stores/${params.id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="danger"
              >
                Delete
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-surface-elevated rounded-lg p-4">
              <div className="text-sm text-text-secondary mb-1">Products Added</div>
              <div className="text-3xl font-bold text-text-primary">
                {store.stats.productCount}
              </div>
            </div>
            <div className="bg-surface-elevated rounded-lg p-4">
              <div className="text-sm text-text-secondary mb-1">Last Tested</div>
              <div className="text-lg font-semibold text-text-primary">
                {store.lastTestedAt
                  ? new Date(store.lastTestedAt).toLocaleDateString()
                  : 'Never'}
              </div>
              {store.lastTestResult && (
                <div className="text-xs text-text-muted mt-1">
                  {store.lastTestResult}
                </div>
              )}
            </div>
            <div className="bg-surface-elevated rounded-lg p-4">
              <div className="text-sm text-text-secondary mb-1">Environment</div>
              <div className="text-lg font-semibold text-text-primary capitalize">
                {store.environment}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Store Information */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Store Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-text-secondary">Store Name</dt>
                <dd className="text-text-primary">{store.storeName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-text-secondary">Shop Domain</dt>
                <dd className="text-text-primary">{store.shopDomain}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-text-secondary">Store URL</dt>
                <dd>
                  <a
                    href={store.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 hover:text-primary-600"
                  >
                    {store.storeUrl}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-text-secondary">Created</dt>
                <dd className="text-text-primary">
                  {new Date(store.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-text-secondary">Last Updated</dt>
                <dd className="text-text-primary">
                  {new Date(store.updatedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>

            {!store.isDefault && (
              <div className="mt-6">
                <Button onClick={handleSetDefault} variant="secondary" className="w-full">
                  Set as Default Store
                </Button>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Recent Activity</h2>
            {store.recentActivity && store.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {store.recentActivity.map((activity, index) => (
                  <div key={index} className="border-b border-border-default pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary">
                        {activity.action.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          activity.success
                            ? 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/50'
                            : 'bg-red-500/20 text-red-400 border border-red-500/50'
                        }`}
                      >
                        {activity.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm">No recent activity</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href={`/dashboard/stores/${params.id}/products`}
              className="bg-surface-elevated hover:bg-surface-hover border border-border-default rounded-lg p-4 text-center transition-colors"
            >
              <div className="text-3xl mb-2">📦</div>
              <div className="font-semibold text-text-primary">View Products</div>
              <div className="text-sm text-text-secondary">
                Manage products in this store
              </div>
            </Link>
            <a
              href={store.storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface-elevated hover:bg-surface-hover border border-border-default rounded-lg p-4 text-center transition-colors"
            >
              <div className="text-3xl mb-2">🛍️</div>
              <div className="font-semibold text-text-primary">Visit Store</div>
              <div className="text-sm text-text-secondary">
                Open store in new tab
              </div>
            </a>
            <Link
              href={`/dashboard/stores/${params.id}/edit`}
              className="bg-surface-elevated hover:bg-surface-hover border border-border-default rounded-lg p-4 text-center transition-colors"
            >
              <div className="text-3xl mb-2">⚙️</div>
              <div className="font-semibold text-text-primary">Edit Store</div>
              <div className="text-sm text-text-secondary">
                Update store settings
              </div>
            </Link>
          </div>
        </div>

        {/* Delete Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Store Connection"
          message="Are you sure you want to delete this store connection? This action cannot be undone. Products already added to your Shopify store will remain."
          confirmText="Delete"
          confirmVariant="danger"
        />
      </div>
    </div>
  );
}

