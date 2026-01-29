'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import LoadingScreen from '@/components/LoadingScreen';
import IconBadge from '@/components/IconBadge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Users as UsersIcon, Store, AlertTriangle, Package, UserCheck } from 'lucide-react';
import Link from 'next/link';

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


export default function AdminDashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);

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
      fetchServiceOrders();
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchDashboardData();
        fetchHealth();
        fetchServiceOrders();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const fetchServiceOrders = async () => {
    try {
      const response = await api.get<{ success: boolean; data: { orders: any[] } }>(
        '/api/services/orders/admin/all?limit=5&page=1'
      );
      setServiceOrders((response.data?.orders || []).slice(0, 5)); // Show latest 5
    } catch (error: any) {
      console.error('Error fetching service orders:', error);
    }
  };

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
    <div className="space-y-8 animate-fadeIn">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary gradient-text">Admin Dashboard</h1>
            <p className="mt-2 text-text-secondary">System overview and statistics</p>
          </div>

          {health && (
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-6 hover-lift animate-scaleIn">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">System Health</h3>
                  <div className="flex items-center gap-4 flex-wrap text-sm text-text-secondary">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getHealthColor(health.status)}`}></div>
                      <span className="capitalize">{health.status}</span>
                    </div>
                    <span>
                      DB Latency: <span className="font-medium text-text-primary">{health.dbLatency}ms</span>
                    </span>
                    <span>
                      Uptime: <span className="font-medium text-text-primary">{formatUptime(health.uptime)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-4 md:p-6 hover-lift card-enter group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm text-text-secondary">Total Users</p>
                  <p className="text-2xl md:text-3xl font-bold text-text-primary mt-2">{stats.users.total}</p>
                  <p className="text-sm text-secondary-400 mt-1">
                    {stats.users.active} active (last 7 days)
                  </p>
                </div>
                <IconBadge
                  icon={UsersIcon}
                  label="Total users"
                  size="md"
                  className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                />
              </div>
            </div>

            <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-6 hover-lift card-enter-delay-1 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm text-text-secondary">Total Stores</p>
                  <p className="text-3xl font-bold text-text-primary mt-2">{stats.stores.total}</p>
                  <p className="text-sm text-secondary-400 mt-1">
                    {stats.stores.active} active
                  </p>
                </div>
                <IconBadge
                  icon={Store}
                  label="Total stores"
                  size="md"
                  variant="success"
                  className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                />
              </div>
            </div>

            <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-6 hover-lift card-enter-delay-2 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm text-text-secondary">Invalid Stores</p>
                  <p className="text-3xl font-bold text-red-400 mt-2">{stats.stores.invalid}</p>
                  <p className="text-sm text-text-muted mt-1">
                    {stats.stores.revoked} revoked
                  </p>
                </div>
                <IconBadge
                  icon={AlertTriangle}
                  label="Invalid stores"
                  size="md"
                  variant="danger"
                  className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                />
              </div>
            </div>

            <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-6 hover-lift card-enter-delay-3 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm text-text-secondary">Total Products</p>
                  <p className="text-3xl font-bold text-text-primary mt-2">{stats.products.total}</p>
                </div>
                <IconBadge
                  icon={Package}
                  label="Products"
                  size="md"
                  variant="neutral"
                  className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-4 md:p-6 hover-lift animate-scaleIn">
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

            <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-6 hover-lift animate-scaleIn">
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

          {serviceOrders.length > 0 && (
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-6 hover-lift animate-scaleIn">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Recent Service Orders</h3>
                <Link
                  href="/admin/services/orders"
                  className="text-sm text-yellow-500 hover:text-yellow-400 transition-colors"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {serviceOrders.map((order) => (
                  <div
                    key={order._id}
                    className="p-3 bg-surface-elevated rounded-lg border border-border-default hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-text-primary capitalize">
                          {order.serviceType?.replace('_', ' ') || 'N/A'}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {order.userId?.email || 'N/A'} • {order.planType || 'N/A'}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          ₹{(order.amount / 100).toLocaleString('en-IN')} • {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-1 text-xs rounded ${
                          order.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' :
                          order.paymentStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {order.paymentStatus}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          order.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          order.status === 'expired' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-6 hover-lift animate-scaleIn">
            <h3 className="text-lg font-semibold	text-text-primary mb-4">Recent Activity</h3>
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
                  {stats.recentActivity.map((activity, index) => (
                    <tr
                      key={activity.id}
                      className="transition-all duration-200 hover:bg-surface-base"
                      style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s both` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                        {new Date(activity.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {activity.userEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary capitalize">
                        {activity.action.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                        {activity.target}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            activity.success
                              ? 'bg-secondary-500/20 text-secondary-300 border border-secondary-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
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

