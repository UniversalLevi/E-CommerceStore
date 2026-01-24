'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, ShoppingCart, DollarSign, Users } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function StoreAnalyticsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchData();
    }
  }, [authLoading, isAuthenticated, router, period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const storeResponse = await api.getMyStore();
      if (storeResponse.success && storeResponse.data) {
        setStore(storeResponse.data);
        const analyticsResponse = await api.getStoreAnalytics(storeResponse.data._id, period);
        if (analyticsResponse.success) {
          setAnalytics(analyticsResponse.data);
        }
      } else {
        router.push('/dashboard/store');
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      notify.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    const symbol = currencySymbols[store?.currency || 'INR'] || store?.currency || 'INR';
    return `${symbol}${(amount / 100).toFixed(2)}`;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!store || !analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as '7d' | '30d' | '90d' | 'all')}
          className="px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-raised rounded-lg border border-border-default p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-text-secondary">Total Revenue</h3>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-text-primary">{formatCurrency(analytics.summary.totalRevenue)}</p>
        </div>

        <div className="bg-surface-raised rounded-lg border border-border-default p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-text-secondary">Total Orders</h3>
            <ShoppingCart className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-text-primary">{analytics.summary.totalOrders}</p>
          <p className="text-sm text-text-secondary mt-1">{analytics.summary.paidOrders} paid</p>
        </div>

        <div className="bg-surface-raised rounded-lg border border-border-default p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-text-secondary">Average Order Value</h3>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-text-primary">{formatCurrency(analytics.summary.averageOrderValue)}</p>
        </div>

        <div className="bg-surface-raised rounded-lg border border-border-default p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-text-secondary">Unique Customers</h3>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-text-primary">{analytics.customerMetrics.uniqueCustomers}</p>
          <p className="text-sm text-text-secondary mt-1">{analytics.customerMetrics.repeatCustomers} repeat</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-surface-raised rounded-lg border border-border-default p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Revenue Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.revenueOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />
            <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} name="Orders" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-surface-raised rounded-lg border border-border-default p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Order Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.orderStatusBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.orderStatusBreakdown.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Fulfillment Status Breakdown */}
        <div className="bg-surface-raised rounded-lg border border-border-default p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Fulfillment Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.fulfillmentStatusBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.fulfillmentStatusBreakdown.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      {analytics.topProductsByRevenue.length > 0 && (
        <div className="bg-surface-raised rounded-lg border border-border-default p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Top Products by Revenue</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-base border-b border-border-default">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Quantity</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {analytics.topProductsByRevenue.map((product: any, index: number) => (
                  <tr key={product.productId}>
                    <td className="px-4 py-3 text-sm text-text-primary">{product.title}</td>
                    <td className="px-4 py-3 text-sm text-text-primary">{product.quantity}</td>
                    <td className="px-4 py-3 text-sm text-text-primary text-right">{formatCurrency(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
