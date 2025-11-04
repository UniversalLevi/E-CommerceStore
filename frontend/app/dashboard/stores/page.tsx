'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

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
      alert(response.message);
      await fetchStores(); // Refresh to get updated status
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to test connection');
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
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to set default');
      await fetchStores(); // Revert on error
    }
  };

  const handleDelete = async (storeId: string, storeName: string) => {
    if (!confirm(`Are you sure you want to delete "${storeName}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/stores/${storeId}`);
      
      // Optimistic update
      setStores(prevStores => prevStores.filter(store => store._id !== storeId));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete store');
      await fetchStores(); // Revert on error
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      invalid: 'bg-red-100 text-red-800',
      revoked: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.invalid}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
              Auto Shopify Store Builder
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/products" className="text-gray-600 hover:text-gray-900">
                Products
              </Link>
              <span className="text-gray-600">{user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Stores</h1>
              <p className="mt-2 text-gray-600">
                Manage your connected Shopify stores
              </p>
            </div>
            <Link
              href="/dashboard/stores/connect"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              + Connect New Store
            </Link>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Stores Grid */}
          {stores.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No stores connected yet
              </h3>
              <p className="text-gray-600 mb-6">
                Connect your first Shopify store to start creating products
              </p>
              <Link
                href="/dashboard/stores/connect"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Connect Your First Store
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {stores.map((store) => (
                <div
                  key={store._id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {store.storeName}
                        </h3>
                        {getStatusBadge(store.status)}
                        {store.isDefault && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Domain:</span>{' '}
                          <a
                            href={`https://${store.shopDomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline"
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
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {testing === store._id ? 'Testing...' : 'Test Connection'}
                      </button>

                      {!store.isDefault && (
                        <button
                          onClick={() => handleSetDefault(store._id)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Set as Default
                        </button>
                      )}

                      <Link
                        href={`/dashboard/stores/${store._id}/edit`}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium text-center transition-colors"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => handleDelete(store._id, store.storeName)}
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
    </div>
  );
}
