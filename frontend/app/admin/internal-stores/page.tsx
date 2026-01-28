'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Store, Search, Filter, Eye, Ban, CheckCircle } from 'lucide-react';

interface InternalStore {
  _id: string;
  name: string;
  slug: string;
  status: 'inactive' | 'active' | 'suspended';
  currency: string;
  owner: {
    _id: string;
    name?: string;
    email: string;
  };
  createdAt: string;
  stats?: {
    products: number;
    orders: number;
    logs: any;
  };
}

export default function AdminInternalStoresPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<InternalStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
  }, [isAuthenticated, user, page, statusFilter, searchTerm]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await api.get<{
        success: boolean;
        data: InternalStore[];
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/api/admin/internal-stores?${params.toString()}`);

      if (response.success) {
        setStores(response.data);
        setTotalPages(response.pagination.pages);
      }
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      setError(error.response?.data?.error || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (storeId: string) => {
    if (!confirm('Are you sure you want to suspend this store?')) return;

    try {
      await api.post(`/api/admin/internal-stores/${storeId}/suspend`);
      notify.success('Store suspended successfully');
      fetchStores();
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to suspend store');
    }
  };

  const handleActivate = async (storeId: string) => {
    try {
      await api.post(`/api/admin/internal-stores/${storeId}/activate`);
      notify.success('Store activated successfully');
      fetchStores();
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to activate store');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading && stores.length === 0) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading stores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Internal Stores</h1>
          <p className="text-text-secondary">Manage all internal stores created by users</p>
        </div>

        {/* Filters */}
        <div className="bg-surface-raised border border-border-default rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search stores..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-default bg-surface-base text-text-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-text-secondary" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 rounded-lg border border-border-default bg-surface-base text-text-primary"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stores List */}
        <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-hover border-b border-border-default">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Store</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Currency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {stores.map((store) => (
                  <tr key={store._id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-text-primary">{store.name}</div>
                        <div className="text-sm text-text-secondary">{store.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-primary">{store.owner.email}</div>
                      {store.owner.name && (
                        <div className="text-xs text-text-secondary">{store.owner.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(store.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{store.currency}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(store.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/internal-stores/${store._id}`}
                          className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-text-secondary" />
                        </Link>
                        {store.status === 'active' ? (
                          <button
                            onClick={() => handleSuspend(store._id)}
                            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                            title="Suspend Store"
                          >
                            <Ban className="h-4 w-4 text-yellow-500" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(store._id)}
                            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                            title="Activate Store"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {stores.length === 0 && !loading && (
            <div className="text-center py-12">
              <Store className="h-12 w-12 text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary">No stores found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border-default flex items-center justify-between">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-border-default disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-text-secondary">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg border border-border-default disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
