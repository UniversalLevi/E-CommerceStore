'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  productsOverTime: Array<{ date: string; count: number }>;
  storePerformance: Array<{
    storeName: string;
    shopDomain: string;
    status: string;
    productCount: number;
    lastTestedAt?: string;
  }>;
  popularNiches: Array<{ name: string; count: number }>;
  activitySummary: Array<{
    _id: string;
    count: number;
    successCount: number;
  }>;
  summary: {
    totalProducts: number;
    totalStores: number;
    activeStores: number;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await api.get<{ success: boolean; data: AnalyticsData }>(
        `/api/analytics?${params.toString()}`
      );
      setData(response.data);
    } catch (err: any) {
      setError('Failed to load analytics');
      notify.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-base">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Analytics Dashboard</h1>
          <div className="flex gap-4">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
            <div className="text-sm text-text-secondary mb-1">Total Products Added</div>
            <div className="text-3xl font-bold text-text-primary">{data.summary.totalProducts}</div>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
            <div className="text-sm text-text-secondary mb-1">Total Stores</div>
            <div className="text-3xl font-bold text-text-primary">{data.summary.totalStores}</div>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
            <div className="text-sm text-text-secondary mb-1">Active Stores</div>
            <div className="text-3xl font-bold text-text-primary">{data.summary.activeStores}</div>
          </div>
        </div>

        {/* Products Over Time Chart */}
        {data.productsOverTime.length > 0 && (
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-text-primary mb-4">Products Added Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.productsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #505050',
                    color: '#ffffff',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Products Added"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Popular Niches */}
          {data.popularNiches.length > 0 && (
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">Most Popular Niches</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.popularNiches}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #505050',
                      color: '#ffffff',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Activity Summary */}
          {data.activitySummary.length > 0 && (
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">Activity Summary</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.activitySummary}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {data.activitySummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #505050',
                      color: '#ffffff',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Store Performance Table */}
        {data.storePerformance.length > 0 && (
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Store Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border-default">
                    <th className="text-left py-4 px-4 font-semibold text-text-primary">Store Name</th>
                    <th className="text-left py-4 px-4 font-semibold text-text-primary">Domain</th>
                    <th className="text-center py-4 px-4 font-semibold text-text-primary">Status</th>
                    <th className="text-center py-4 px-4 font-semibold text-text-primary">Products</th>
                    <th className="text-left py-4 px-4 font-semibold text-text-primary">Last Tested</th>
                  </tr>
                </thead>
                <tbody>
                  {data.storePerformance.map((store, index) => (
                    <tr key={index} className="border-b border-border-default">
                      <td className="py-4 px-4 font-medium text-text-primary">{store.storeName}</td>
                      <td className="py-4 px-4 text-text-secondary">{store.shopDomain}</td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            store.status === 'active'
                              ? 'bg-green-900 text-green-200'
                              : store.status === 'invalid'
                              ? 'bg-red-900 text-red-200'
                              : 'bg-yellow-900 text-yellow-200'
                          }`}
                        >
                          {store.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-text-primary font-semibold">
                        {store.productCount}
                      </td>
                      <td className="py-4 px-4 text-text-secondary">
                        {store.lastTestedAt
                          ? new Date(store.lastTestedAt).toLocaleDateString()
                          : 'Never'}
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
  );
}

