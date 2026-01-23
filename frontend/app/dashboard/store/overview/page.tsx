'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Store, Package, ShoppingCart, DollarSign, Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function StoreOverviewPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchData();
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const storeResponse = await api.getMyStore();
      if (storeResponse.success && storeResponse.data) {
        setStore(storeResponse.data);
        const overviewResponse = await api.getStoreOverview(storeResponse.data._id);
        if (overviewResponse.success) {
          setStats(overviewResponse.data.stats);
        }
      } else {
        router.push('/dashboard/store');
      }
    } catch (error: any) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!store) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    const symbol = currencySymbols[store.currency] || store.currency;
    return `${symbol}${(amount / 100).toFixed(2)}`;
  };

  const getStatusBadge = () => {
    if (store.status === 'active') {
      if (store.razorpayAccountStatus === 'active') {
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Active
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400">
          <CheckCircle2 className="h-4 w-4" />
          Active (Payment Not Connected)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400">
        <XCircle className="h-4 w-4" />
        Inactive
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{store.name}</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-text-secondary">
              {store.slug}.eazydropshipping.com
            </p>
            <a
              href={`/storefront/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-500 hover:text-purple-400 text-sm underline"
            >
              View Store (Path-based)
            </a>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {store.razorpayAccountStatus !== 'active' && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-text-primary mb-1">Payment Account Optional</h3>
              <p className="text-sm text-text-secondary mb-3">
                Your store is active! Connect your Razorpay account to start accepting payments from customers.
              </p>
              <Link
                href="/dashboard/store/settings"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Connect Payment Account
              </Link>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-raised rounded-lg border border-border-default p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Total Products</h3>
              <Package className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{stats.totalProducts}</p>
            <p className="text-sm text-text-secondary mt-1">{stats.activeProducts} active</p>
          </div>

          <div className="bg-surface-raised rounded-lg border border-border-default p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Total Orders</h3>
              <ShoppingCart className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{stats.totalOrders}</p>
            <p className="text-sm text-text-secondary mt-1">{stats.paidOrders} paid</p>
          </div>

          <div className="bg-surface-raised rounded-lg border border-border-default p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Total Revenue</h3>
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sm text-text-secondary mt-1">All time</p>
          </div>

          <div className="bg-surface-raised rounded-lg border border-border-default p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">Store Status</h3>
              <Store className="h-5 w-5 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary capitalize">{store.status}</p>
            <p className="text-sm text-text-secondary mt-1">Payment: {store.razorpayAccountStatus}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/store/products"
          className="bg-surface-raised rounded-lg border border-border-default p-6 hover:border-purple-500/50 transition-colors"
        >
          <Package className="h-8 w-8 text-purple-500 mb-3" />
          <h3 className="font-semibold text-text-primary mb-1">Manage Products</h3>
          <p className="text-sm text-text-secondary">Add, edit, and manage your products</p>
        </Link>

        <Link
          href="/dashboard/store/orders"
          className="bg-surface-raised rounded-lg border border-border-default p-6 hover:border-blue-500/50 transition-colors"
        >
          <ShoppingCart className="h-8 w-8 text-blue-500 mb-3" />
          <h3 className="font-semibold text-text-primary mb-1">View Orders</h3>
          <p className="text-sm text-text-secondary">Track and manage customer orders</p>
        </Link>

        <Link
          href="/dashboard/store/settings"
          className="bg-surface-raised rounded-lg border border-border-default p-6 hover:border-indigo-500/50 transition-colors"
        >
          <Store className="h-8 w-8 text-indigo-500 mb-3" />
          <h3 className="font-semibold text-text-primary mb-1">Store Settings</h3>
          <p className="text-sm text-text-secondary">Configure your store settings</p>
        </Link>
      </div>
    </div>
  );
}
