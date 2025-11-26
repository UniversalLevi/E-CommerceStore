'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import LoadingScreen from '@/components/LoadingScreen';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

interface DashboardStats {
  users: {
    total: number;
    active: number;
  };
  stores: {
    total: number;
    active: number;
    invalid: number;
    revoked: number;
  };
  products: {
    total: number;
  };
  trends: {
    registrations: Array<{ _id: string; count: number }>;
    storeConnections: Array<{ _id: string; count: number }>;
  };
  storeStatusDistribution: Array<{ _id: string; count: number }>;
  recentActivity: Array<{
    id: string;
    timestamp: string;
    userEmail: string;
    action: string;
    target: string;
    success: boolean;
    details: any;
  }>;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  dbLatency: number;
  uptime: number;
}

const COLORS = ['#a0a0a0', '#ef4444', '#808080'];

export default function AdminDashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
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
    if (isAuthenticated && user?.role === 'admin') {
      fetchDashboardData();
      fetchHealth();
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchDashboardData();
        fetchHealth();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get<{ success: boolean; data: DashboardStats }>(
        '/api/admin/dashboard'
      );
      setStats(response.data);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await api.get<{ success: boolean; data: SystemHealth }>(
        '/api/admin/health'
      );
      setHealth(response.data);
    } catch (error: any) {
      console.error('Error fetching health:', error);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-secondary-500';
      case 'degraded':
        return 'bg-accent-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-accent-500';
    }
  };

  if (authLoading || loading) {
    return (
      <LoadingScreen />
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-red-400">{error || 'Failed to load dashboard'}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-black rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
            <p className="mt-2 text-text-secondary">System overview and statistics</p>
          </div>

          {/* System Health */}
          {health && (
            <div className="mb-6 bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">System Health</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getHealthColor(health.status)}`}></div>
                      <span className="text-sm text-text-secondary capitalize">{health.status}</span>
                    </div>
                    <span className="text-sm text-text-secondary">
                      DB Latency: <span className="font-medium">{health.dbLatency}ms</span>
                    </span>
                    <span className="text-sm text-text-secondary">
                      Uptime: <span className="font-medium">{formatUptime(health.uptime)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Users</p>
                  <p className="text-3xl font-bold text-text-primary mt-2">{stats.users.total}</p>
                  <p className="text-sm text-secondary-400 mt-1">
                    {stats.users.active} active (last 7 days)
                  </p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </div>

            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Stores</p>
                  <p className="text-3xl font-bold text-text-primary mt-2">{stats.stores.total}</p>
                  <p className="text-sm text-secondary-400 mt-1">
                    {stats.stores.active} active
                  </p>
                </div>
                <div className="text-4xl">🏪</div>
              </div>
            </div>

            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Invalid Stores</p>
                  <p className="text-3xl font-bold text-red-400 mt-2">{stats.stores.invalid}</p>
                  <p className="text-sm text-text-muted mt-1">
                    {stats.stores.revoked} revoked
                  </p>
                </div>
                <div className="text-4xl">⚠️</div>
              </div>
            </div>

            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Total Products</p>
                  <p className="text-3xl font-bold text-text-primary mt-2">{stats.products.total}</p>
                </div>
                <div className="text-4xl">📦</div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Registrations */}
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                User Registrations (Last 30 Days)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.trends.registrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#505050" />
                  <XAxis dataKey="_id" stroke="#a0a0a0" />
                  <YAxis stroke="#a0a0a0" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#ffffff" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Store Connections */}
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Store Connections (Last 30 Days)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.trends.storeConnections}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#505050" />
                  <XAxis dataKey="_id" stroke="#a0a0a0" />
                  <YAxis stroke="#a0a0a0" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#a0a0a0" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Store Status Distribution */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Store Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.storeStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, percent }) => {
                    const p = typeof percent === 'number' ? percent : 0;
                    return `${_id}: ${(p * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.storeStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-default">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface-raised divide-y divide-border-default">
                  {stats.recentActivity.map((activity) => (
                    <tr key={activity.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                        {new Date(activity.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {activity.userEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {activity.action.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                        {activity.target}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            activity.success
                              ? 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/50'
                              : 'bg-red-500/20 text-red-400 border border-red-500/50'
                          }`}
                        >
                          {activity.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

