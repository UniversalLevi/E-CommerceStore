'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';

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
  owner: {
    _id: string;
    email: string;
    role: string;
  };
}

export default function AdminStoresPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<StoreConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchStores();
    }
  }, [isAuthenticated, user]);

  const fetchStores = async () => {
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
  };

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
      await fetchStores();
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to test connection');
    } finally {
      setTesting(null);
    }
  };

  const handleDelete = async (storeId: string, storeName: string, ownerEmail: string) => {
    if (!confirm(`Delete "${storeName}" (owned by ${ownerEmail})?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/api/stores/${storeId}`);
      await fetchStores();
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to delete store');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/50',
      invalid: 'bg-red-500/20 text-red-400 border border-red-500/50',
      revoked: 'bg-accent-500/20 text-accent-400 border border-accent-500/50',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.invalid}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Filter stores
  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.shopDomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || store.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
      {/* Navigation */}
      <nav className="bg-surface-raised border-b border-border-default shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-500">
              Auto Shopify Store Builder
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-text-secondary hover:text-primary-500">
                Dashboard
              </Link>
              <Link href="/admin/products" className="text-text-secondary hover:text-primary-500">
                Products
              </Link>
              <span className="text-text-secondary">{user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-text-primary">All Stores (Admin)</h1>
            <p className="mt-2 text-text-secondary">
              Manage all connected Shopify stores across all users
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="bg-surface-raised border border-border-default rounded-lg shadow-md p-4 mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by store name, domain, or owner email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Status Filter
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="invalid">Invalid</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-text-secondary">
              <span>Total Stores: <strong>{stores.length}</strong></span>
              <span>Filtered: <strong>{filteredStores.length}</strong></span>
              <span>Active: <strong>{stores.filter(s => s.status === 'active').length}</strong></span>
              <span>Invalid: <strong>{stores.filter(s => s.status === 'invalid').length}</strong></span>
            </div>
          </div>

          {/* Stores Table */}
          {filteredStores.length === 0 ? (
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No stores found
              </h3>
              <p className="text-text-secondary">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No stores have been connected yet'}
              </p>
            </div>
          ) : (
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border-default">
                  <thead className="bg-surface-elevated">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Store
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Last Tested
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface-raised divide-y divide-border-default">
                    {filteredStores.map((store) => (
                      <tr key={store._id} className="hover:bg-surface-hover">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-text-primary">
                              {store.storeName}
                              {store.isDefault && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-secondary-500/20 text-secondary-400 border border-secondary-500/50">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-text-muted">{store.shopDomain}</div>
                            <div className="text-xs text-text-muted">{store.environment}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-text-primary">{store.owner?.email || 'N/A'}</div>
                          <div className="text-xs text-text-muted">Role: {store.owner?.role || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(store.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">
                          {store.lastTestedAt
                            ? new Date(store.lastTestedAt).toLocaleString()
                            : 'Never'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleTest(store._id)}
                              disabled={testing === store._id}
                              className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-black rounded text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              {testing === store._id ? 'Testing...' : 'Test'}
                            </button>
                            <button
                              onClick={() => handleDelete(store._id, store.storeName, store.owner?.email || 'Unknown')}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



