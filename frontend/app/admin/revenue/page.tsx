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

interface RevenueSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  paymentsCount: number;
  successfulPayments: number;
  failedPayments: number;
  revenueByPlan: Array<{
    planCode: string;
    planName: string;
    count: number;
    amount: number;
  }>;
  activeSubscriptions: number;
  newPaymentsThisMonth: number;
}

interface Payment {
  id: string;
  userId: string;
  userEmail: string;
  planCode: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  paymentId: string;
  orderId: string;
  subscriptionId?: string;
  createdAt: string;
}

interface PaymentsResponse {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const COLORS = ['#ffffff', '#a0a0a0', '#ef4444', '#808080'];

export default function AdminRevenuePage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    planCode: '',
    status: '',
    search: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchSummary();
      fetchPayments();
    }
  }, [isAuthenticated, user, pagination.page, filters]);

  const fetchSummary = async () => {
    try {
      const response = await api.get<{ success: boolean; data: RevenueSummary }>(
        '/api/admin/revenue/summary'
      );
      setSummary(response.data);
    } catch (error: any) {
      console.error('Error fetching revenue summary:', error);
      setError(error.response?.data?.message || 'Failed to load revenue summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.planCode) params.append('planCode', filters.planCode);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get<{ success: boolean; data: PaymentsResponse }>(
        `/api/admin/revenue/payments?${params.toString()}`
      );
      setPayments(response.data.payments);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      notify.error('Failed to load payments');
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.planCode) params.append('planCode', filters.planCode);
      if (filters.status) params.append('status', filters.status);

      // Use fetch with credentials to include cookies for authentication
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const baseUrl = apiUrl.replace(/\/+$/, '');
      const hasApiSuffix = baseUrl.endsWith('/api');
      const path = hasApiSuffix 
        ? `/admin/revenue/export?${params.toString()}`
        : `/api/admin/revenue/export?${params.toString()}`;

      const response = await fetch(
        `${baseUrl}${path}`,
        {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'text/csv',
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        notify.success('Payments exported successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        notify.error(errorData.message || 'Failed to export payments');
      }
    } catch (error) {
      console.error('Error exporting payments:', error);
      notify.error('Failed to export payments');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading || authLoading) {
    return <LoadingScreen />;
  }

  if (error && !summary) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-text-secondary mb-4">{error}</p>
          <button
            onClick={() => {
              setError('');
              fetchSummary();
            }}
            className="px-4 py-2 bg-primary-500 text-black rounded-lg hover:bg-primary-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const revenueByPlanData = summary?.revenueByPlan.map((item) => ({
    name: item.planName,
    revenue: item.amount / 100,
    count: item.count,
  })) || [];

  // Mock data for revenue over time (last 12 months)
  // In a real implementation, you'd fetch this from the backend
  const revenueOverTimeData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return {
      month: date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      revenue: Math.floor(Math.random() * 100000) + 50000, // Mock data
    };
  });

  // Subscription status data
  const subscriptionStatusData = [
    { name: 'Active', value: summary?.activeSubscriptions || 0 },
    { name: 'Expired', value: (summary?.paymentsCount || 0) - (summary?.activeSubscriptions || 0) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Revenue Dashboard</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-primary-500 text-black rounded-lg hover:bg-primary-600 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-text-secondary text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-text-primary">
                {summary ? formatCurrency(summary.totalRevenue) : '₹0.00'}
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-text-secondary text-sm mb-1">Revenue This Month</p>
              <p className="text-3xl font-bold text-text-primary">
                {summary ? formatCurrency(summary.monthlyRevenue) : '₹0.00'}
              </p>
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>

        <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-text-secondary text-sm mb-1">Active Subscriptions</p>
              <p className="text-3xl font-bold text-text-primary">
                {summary?.activeSubscriptions || 0}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-text-secondary text-sm mb-1">New Payments (Month)</p>
              <p className="text-3xl font-bold text-text-primary">
                {summary?.newPaymentsThisMonth || 0}
              </p>
            </div>
            <div className="text-4xl">💳</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Revenue Over Time (Last 12 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueOverTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#505050" />
              <XAxis dataKey="month" stroke="#a0a0a0" />
              <YAxis stroke="#a0a0a0" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #505050',
                  color: '#ffffff',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#ffffff"
                strokeWidth={2}
                name="Revenue (₹)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Performance */}
        <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Revenue by Plan
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByPlanData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#505050" />
              <XAxis dataKey="name" stroke="#a0a0a0" />
              <YAxis stroke="#a0a0a0" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #505050',
                  color: '#ffffff',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#ffffff" name="Revenue (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subscription Status Pie Chart */}
      <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Subscription Status Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={subscriptionStatusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => {
                const p = typeof percent === 'number' ? percent : 0;
                return `${name}: ${(p * 100).toFixed(0)}%`;
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {subscriptionStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #505050',
                color: '#ffffff',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Payments Table */}
      <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Payments</h3>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
            placeholder="End Date"
          />
          <select
            value={filters.planCode}
            onChange={(e) => setFilters({ ...filters, planCode: e.target.value })}
            className="px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
          >
            <option value="">All Plans</option>
            <option value="starter_30">Starter Monthly</option>
            <option value="growth_90">Growth Quarterly</option>
            <option value="lifetime">Lifetime</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="created">Created</option>
            <option value="refunded">Refunded</option>
          </select>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
            placeholder="Search by email..."
          />
        </div>

        {/* Table */}
        {loadingPayments ? (
          <div className="text-center py-8">
            <p className="text-text-secondary">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary">No payments found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Date</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">User</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Plan</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-text-secondary font-semibold">Payment ID</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-border-default hover:bg-surface-base transition-colors"
                    >
                      <td className="py-3 px-4 text-text-primary">{formatDate(payment.createdAt)}</td>
                      <td className="py-3 px-4 text-text-primary">{payment.userEmail}</td>
                      <td className="py-3 px-4 text-text-primary">{payment.planName}</td>
                      <td className="py-3 px-4 text-text-primary">{formatCurrency(payment.amount)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            payment.status === 'paid'
                              ? 'bg-green-500/20 text-green-400'
                              : payment.status === 'failed'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-sm font-mono">
                        {payment.paymentId || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <p className="text-text-secondary text-sm">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} payments
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-raised"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-raised"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

