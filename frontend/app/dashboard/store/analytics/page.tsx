'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, ShoppingCart, DollarSign, Users, Calendar } from 'lucide-react';

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function StoreAnalyticsPage() {
  const { store } = useStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    if (store) {
      fetchData();
    }
  }, [store, period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (store) {
        const analyticsResponse = await api.getStoreAnalytics(store._id, period);
        if (analyticsResponse.success) {
          setAnalytics(analyticsResponse.data);
        }
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

  if (loading) {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">Track your store performance and insights</p>
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as '7d' | '30d' | '90d' | 'all')}
            className="pl-10 pr-4 py-2.5 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-green-600/10 to-green-600/5 rounded-xl border border-green-500/20 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">Revenue</h3>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-text-primary mb-1">{formatCurrency(analytics.summary.totalRevenue)}</p>
          <p className="text-sm text-text-secondary">Total revenue</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600/10 to-blue-600/5 rounded-xl border border-blue-500/20 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">Orders</h3>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-text-primary mb-1">{analytics.summary.totalOrders}</p>
          <p className="text-sm text-text-secondary">{analytics.summary.paidOrders} paid</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600/10 to-purple-600/5 rounded-xl border border-purple-500/20 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">Avg Order</h3>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-text-primary mb-1">{formatCurrency(analytics.summary.averageOrderValue)}</p>
          <p className="text-sm text-text-secondary">Average value</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-600/10 to-indigo-600/5 rounded-xl border border-indigo-500/20 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">Customers</h3>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-text-primary mb-1">{analytics.customerMetrics.uniqueCustomers}</p>
          <p className="text-sm text-text-secondary">{analytics.customerMetrics.repeatCustomers} repeat</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-surface-raised rounded-xl border border-border-default p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-text-primary mb-6">Revenue Over Time</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={analytics.revenueOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151', 
                borderRadius: '8px',
                padding: '12px'
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} name="Revenue" dot={{ fill: '#8B5CF6', r: 4 }} />
            <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={3} name="Orders" dot={{ fill: '#3B82F6', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-surface-raised rounded-xl border border-border-default p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-text-primary mb-6">Order Status</h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={analytics.orderStatusBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const { status, percent } = props;
                  return `${status}: ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={100}
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
        <div className="bg-surface-raised rounded-xl border border-border-default p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-text-primary mb-6">Fulfillment Status</h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={analytics.fulfillmentStatusBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const { status, percent } = props;
                  return `${status}: ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={100}
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
        <div className="bg-surface-raised rounded-xl border border-border-default p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-text-primary mb-6">Top Products by Revenue</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-surface-base to-surface-raised border-b border-border-default">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {analytics.topProductsByRevenue.map((product: any, index: number) => (
                  <tr key={product.productId} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">{product.title}</td>
                    <td className="px-6 py-4 text-sm text-text-primary">{product.quantity}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-text-primary text-right">{formatCurrency(product.revenue)}</td>
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
