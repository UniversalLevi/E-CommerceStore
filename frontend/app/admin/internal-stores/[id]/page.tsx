'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { ArrowLeft, Store, Package, ShoppingCart, FileText, Ban, CheckCircle, Settings } from 'lucide-react';

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
  settings?: any;
  stats?: {
    products: number;
    orders: number;
    logs: any;
  };
}

export default function AdminInternalStoreDetailPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;
  const [store, setStore] = useState<InternalStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin' && storeId) {
      fetchStore();
    }
  }, [isAuthenticated, user, storeId]);

  const fetchStore = async () => {
    try {
      setLoading(true);
      const response = await api.getAdminInternalStore(storeId);
      if (response.success) {
        setStore(response.data);
      } else {
        setError('Store not found');
      }
    } catch (error: any) {
      console.error('Error fetching store:', error);
      setError(error.response?.data?.error || 'Failed to load store');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this store?')) return;

    try {
      await api.suspendAdminInternalStore(storeId);
      notify.success('Store suspended successfully');
      fetchStore();
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to suspend store');
    }
  };

  const handleActivate = async () => {
    try {
      await api.activateAdminInternalStore(storeId);
      notify.success('Store activated successfully');
      fetchStore();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading store...</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Store Not Found</h1>
          <p className="text-text-secondary mb-6">{error || 'This store does not exist'}</p>
          <Link
            href="/admin/internal-stores"
            className="inline-block px-6 py-3 rounded-lg bg-primary-500 text-black font-medium hover:bg-primary-600 transition-colors"
          >
            Back to Stores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/internal-stores"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Internal Stores
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">{store.name}</h1>
              <p className="text-text-secondary">{store.slug}.eazydropshipping.com</p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(store.status)}
              {store.status === 'active' ? (
                <button
                  onClick={handleSuspend}
                  className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                >
                  <Ban className="h-4 w-4" />
                  Suspend
                </button>
              ) : (
                <button
                  onClick={handleActivate}
                  className="px-4 py-2 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Activate
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Products</h3>
              <Package className="h-5 w-5 text-text-secondary" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{store.stats?.products || 0}</p>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Orders</h3>
              <ShoppingCart className="h-5 w-5 text-text-secondary" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{store.stats?.orders || 0}</p>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Activity Logs</h3>
              <FileText className="h-5 w-5 text-text-secondary" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{store.stats?.logs?.total || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-surface-raised border border-border-default rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href={`/admin/internal-stores/${storeId}/logs`}
              className="p-4 rounded-lg border border-border-default hover:bg-surface-hover transition-colors"
            >
              <FileText className="h-5 w-5 text-text-secondary mb-2" />
              <h3 className="font-medium text-text-primary">View Activity Logs</h3>
              <p className="text-sm text-text-secondary mt-1">View all store activity</p>
            </Link>
            <Link
              href={`/admin/internal-stores/${storeId}/products`}
              className="p-4 rounded-lg border border-border-default hover:bg-surface-hover transition-colors"
            >
              <Package className="h-5 w-5 text-text-secondary mb-2" />
              <h3 className="font-medium text-text-primary">View Products</h3>
              <p className="text-sm text-text-secondary mt-1">Manage store products</p>
            </Link>
            <Link
              href={`/admin/internal-stores/${storeId}/orders`}
              className="p-4 rounded-lg border border-border-default hover:bg-surface-hover transition-colors"
            >
              <ShoppingCart className="h-5 w-5 text-text-secondary mb-2" />
              <h3 className="font-medium text-text-primary">View Orders</h3>
              <p className="text-sm text-text-secondary mt-1">Manage store orders</p>
            </Link>
          </div>
        </div>

        {/* Store Details */}
        <div className="bg-surface-raised border border-border-default rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Store Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-text-secondary mb-1">Store Name</p>
              <p className="text-text-primary font-medium">{store.name}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Slug</p>
              <p className="text-text-primary font-medium">{store.slug}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Currency</p>
              <p className="text-text-primary font-medium">{store.currency}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Owner</p>
              <p className="text-text-primary font-medium">{store.owner.email}</p>
              {store.owner.name && (
                <p className="text-sm text-text-secondary">{store.owner.name}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Created</p>
              <p className="text-text-primary font-medium">
                {new Date(store.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">Store URL</p>
              <a
                href={`https://${store.slug}.eazydropshipping.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline"
              >
                View Storefront
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
