'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import LoadingScreen from '@/components/LoadingScreen';
import IconBadge from '@/components/IconBadge';
import { DollarSign, CalendarDays, BadgeCheck, CreditCard } from 'lucide-react';
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
  paymentsByDate: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
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
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
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

  // Payments by date data
  const paymentsByDateData = summary?.paymentsByDate?.map((item) => {
    const date = new Date(item.date);
    return {
      date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      payments: item.count,
      fullDate: item.date,
    };
  }) || [];


  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center animate-slideIn">
        <h1 className="text-3xl font-bold text-text-primary gradient-text">Revenue Dashboard</h1>
        <button
          onClick={handleExport}
          className="px-6 py-3 bg-primary-500 text-black rounded-lg hover:bg-primary-600 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl font-medium"
        >
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-6 hover-lift card-enter group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-text-secondary text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-text-primary transition-transform duration-300 group-hover:scale-105">
                {summary ? formatCurrency(summary.totalRevenue) : '₹0.00'}
              </p>
            </div>
            <IconBadge
              icon={DollarSign}
              label="Total revenue"
              size="md"
              variant="primary"
              className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            />
          </div>
        </div>

        <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-6 hover-lift card-enter-delay-1 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-text-secondary text-sm mb-1">Revenue This Month</p>
              <p className="text-3xl font-bold text-text-primary transition-transform duration-300 group-hover:scale-105">
                {summary ? formatCurrency(summary.monthlyRevenue) : '₹0.00'}
              </p>
            </div>
            <IconBadge
              icon={CalendarDays}
              label="Monthly revenue"
              size="md"
              variant="success"
              className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            />
          </div>
        </div>

        <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-6 hover-lift card-enter-delay-2 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-text-secondary text-sm mb-1">Active Subscriptions</p>
              <p className="text-3xl font-bold text-text-primary transition-transform duration-300 group-hover:scale-105">
                {summary?.activeSubscriptions || 0}
              </p>
            </div>
            <IconBadge
              icon={BadgeCheck}
              label="Active subscriptions"
              size="md"
              variant="warning"
              className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            />
          </div>
        </div>

        <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-6 hover-lift card-enter-delay-3 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-text-secondary text-sm mb-1">New Payments (Month)</p>
              <p className="text-3xl font-bold text-text-primary transition-transform duration-300 group-hover:scale-105">
                {summary?.newPaymentsThisMonth || 0}
              </p>
            </div>
            <IconBadge
              icon={CreditCard}
              label="New payments"
              size="md"
              variant="neutral"
              className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payments Over Time */}
        <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-6 hover-lift animate-scaleIn">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Payments vs Date (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={paymentsByDateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#505050" />
              <XAxis 
                dataKey="date" 
                stroke="#a0a0a0"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#a0a0a0" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #505050',
                  color: '#ffffff',
                  borderRadius: '8px',
                }}
                labelFormatter={(value, payload) => {
                  if (payload && payload[0]) {
                    return `Date: ${payload[0].payload.fullDate}`;
                  }
                  return `Date: ${value}`;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="payments"
                stroke="#ffffff"
                strokeWidth={2}
                name="Payments"
                dot={{ fill: '#ffffff', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Performance */}
        <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-6 hover-lift animate-scaleIn">
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

      {/* Payments Table */}
      <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-6 animate-fadeIn">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Payments</h3>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-3 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-3 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            placeholder="End Date"
          />
          <select
            value={filters.planCode}
            onChange={(e) => setFilters({ ...filters, planCode: e.target.value })}
            className="px-3 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
          >
            <option value="">All Plans</option>
            <option value="starter_30">Starter Monthly</option>
            <option value="growth_90">Growth Quarterly</option>
            <option value="lifetime">Lifetime</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
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
            className="px-3 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            placeholder="Search by email..."
          />
        </div>

        {/* Table */}
        {loadingPayments ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
            <p className="text-text-secondary">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 animate-fadeIn">
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
                  {payments.map((payment, index) => (
                    <tr
                      key={payment.id}
                      className="border-b border-border-default hover:bg-surface-base transition-all duration-200 hover:shadow-md"
                      style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s both` }}
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
                  className="px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-raised transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-raised transition-all duration-200 hover:scale-105 active:scale-95"
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

