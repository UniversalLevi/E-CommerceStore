'use client';

import { useEffect, useState } from 'react';
import { useStore } from '../layout';
import { api } from '@/lib/api';
import { Package, ShoppingCart, DollarSign, Loader2, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function StoreOverviewPage() {
  const { store, loading: storeLoading } = useStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (store) {
      fetchStats();
    }
  }, [store]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      if (store) {
        const overviewResponse = await api.getStoreOverview(store._id);
        if (overviewResponse.success) {
          setStats(overviewResponse.data.stats);
        }
      }
    } catch (error: any) {
      console.error('Error fetching store stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (storeLoading || loading) {
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


  return (
    <div className="space-y-6">
      {/* Payment Account Alert */}
      {store.razorpayAccountStatus !== 'active' && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-5 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary mb-1.5">Connect Payment Account</h3>
              <p className="text-sm text-text-secondary mb-4">
                Your store is active! Connect your Razorpay account to start accepting real payments from customers.
              </p>
              <Link
                href="/dashboard/store/settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-sm shadow-lg shadow-blue-500/25"
              >
                Go to Settings
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-gradient-to-br from-purple-600/10 to-purple-600/5 rounded-xl border border-purple-500/20 p-6 hover:border-purple-500/40 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">Products</h3>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-text-primary mb-1">{stats.totalProducts}</p>
            <p className="text-sm text-text-secondary flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {stats.activeProducts} active
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-600/10 to-blue-600/5 rounded-xl border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">Orders</h3>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-text-primary mb-1">{stats.totalOrders}</p>
            <p className="text-sm text-text-secondary flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {stats.paidOrders} paid
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-600/10 to-green-600/5 rounded-xl border border-green-500/20 p-6 hover:border-green-500/40 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">Revenue</h3>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-text-primary mb-1">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sm text-text-secondary">All time revenue</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600/10 to-indigo-600/5 rounded-xl border border-indigo-500/20 p-6 hover:border-indigo-500/40 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">Status</h3>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-text-primary mb-1 capitalize">{store.status}</p>
            <p className="text-sm text-text-secondary">Payment: {store.razorpayAccountStatus || 'not connected'}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/store/products"
            className="group bg-surface-raised rounded-xl border border-border-default p-6 hover:border-purple-500/50 hover:shadow-xl transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-text-primary mb-2 group-hover:text-purple-400 transition-colors">Manage Products</h3>
            <p className="text-sm text-text-secondary mb-3">Add, edit, and manage your products</p>
            <div className="flex items-center gap-1 text-sm text-purple-500 group-hover:gap-2 transition-all">
              <span>View Products</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            href="/dashboard/store/orders"
            className="group bg-surface-raised rounded-xl border border-border-default p-6 hover:border-blue-500/50 hover:shadow-xl transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-text-primary mb-2 group-hover:text-blue-400 transition-colors">View Orders</h3>
            <p className="text-sm text-text-secondary mb-3">Track and manage customer orders</p>
            <div className="flex items-center gap-1 text-sm text-blue-500 group-hover:gap-2 transition-all">
              <span>View Orders</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            href="/dashboard/store/analytics"
            className="group bg-surface-raised rounded-xl border border-border-default p-6 hover:border-green-500/50 hover:shadow-xl transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-text-primary mb-2 group-hover:text-green-400 transition-colors">Analytics</h3>
            <p className="text-sm text-text-secondary mb-3">View sales and performance metrics</p>
            <div className="flex items-center gap-1 text-sm text-green-500 group-hover:gap-2 transition-all">
              <span>View Analytics</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            href="/dashboard/store/settings"
            className="group bg-surface-raised rounded-xl border border-border-default p-6 hover:border-indigo-500/50 hover:shadow-xl transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-text-primary mb-2 group-hover:text-indigo-400 transition-colors">Settings</h3>
            <p className="text-sm text-text-secondary mb-3">Configure your store settings</p>
            <div className="flex items-center gap-1 text-sm text-indigo-500 group-hover:gap-2 transition-all">
              <span>Open Settings</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
