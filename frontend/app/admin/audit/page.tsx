'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';

interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  target: string;
  success: boolean;
  errorMessage?: string;
  details: any;
  ipAddress?: string;
}

// Helper function to format details for display
function formatDetailsForDisplay(details: any): JSX.Element {
  if (!details || typeof details !== 'object') {
    return <span className="text-text-muted">No details available</span>;
  }

  const entries = Object.entries(details);
  if (entries.length === 0) {
    return <span className="text-text-muted">No details available</span>;
  }

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => {
        const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
        const isArray = Array.isArray(value);
        const isComplex = isObject || isArray;

        return (
          <div key={key} className="border-l-2 border-border-default pl-3">
            <div className="text-sm font-medium text-text-secondary mb-1">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </div>
            {isComplex ? (
              <pre className="bg-surface-elevated p-3 rounded text-xs text-text-primary overflow-x-auto mt-1">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <div className="text-sm text-text-primary mt-1">
                {String(value)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminAuditPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [userId, setUserId] = useState(searchParams.get('userId') || '');
  const [storeId, setStoreId] = useState('');
  const [action, setAction] = useState('');
  const [success, setSuccess] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchLogs = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'admin') return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      });

      if (userId) params.append('userId', userId);
      if (storeId) params.append('storeId', storeId);
      if (action) params.append('action', action);
      if (success) params.append('success', success);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get<{
        success: boolean;
        data: { logs: AuditLog[]; pagination: Pagination };
      }>(`/api/admin/audit?${params.toString()}`);

      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      setError(error.response?.data?.message || 'Failed to load audit logs');
      notify.error(error.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, currentPage, userId, storeId, action, success, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (storeId) params.append('storeId', storeId);
      if (action) params.append('action', action);
      if (success) params.append('success', success);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/audit/export?${params.toString()}`,
        {
          credentials: 'include',
        }
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      notify.success('Audit logs exported successfully');
    } catch (error: any) {
      notify.error('Failed to export audit logs');
    }
  };

  const clearFilters = () => {
    setUserId('');
    setStoreId('');
    setAction('');
    setSuccess('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Navigation */}
      <nav className="bg-surface-raised border-b border-border-default shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-500">
              Auto Shopify Store Builder
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-text-secondary hover:text-primary-500">
                Dashboard
              </Link>
              <Link href="/admin/users" className="text-text-secondary hover:text-primary-500">
                Users
              </Link>
              <Link href="/admin/stores" className="text-text-secondary hover:text-primary-500">
                Stores
              </Link>
              <Link href="/admin/audit" className="text-text-primary font-medium">
                Audit Logs
              </Link>
              <Link href="/admin/products" className="text-text-secondary hover:text-primary-500">
                Products
              </Link>
              <span className="text-text-secondary">{user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Audit Logs</h1>
              <p className="mt-2 text-text-secondary">System activity and user actions</p>
            </div>
            <button
              onClick={handleExport}
              className="px-6 py-3 bg-secondary-500 hover:bg-secondary-600 text-black rounded-lg font-medium transition-colors"
            >
              Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter by user ID..."
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Action
                </label>
                <select
                  value={action}
                  onChange={(e) => {
                    setAction(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="">All Actions</option>
                  <option value="USER_REGISTER">User Register</option>
                  <option value="USER_LOGIN">User Login</option>
                  <option value="CHANGE_PASSWORD">Change Password</option>
                  <option value="RESET_PASSWORD">Reset Password</option>
                  <option value="FORGOT_PASSWORD">Forgot Password</option>
                  <option value="DELETE_ACCOUNT">Delete Account</option>
                  <option value="CREATE_STORE">Create Store</option>
                  <option value="UPDATE_STORE">Update Store</option>
                  <option value="DELETE_STORE">Delete Store</option>
                  <option value="TEST_STORE">Test Store</option>
                  <option value="ADD_PRODUCT_TO_STORE">Add Product to Store</option>
                  <option value="PAYMENT_CREATE_ORDER">Payment Create Order</option>
                  <option value="PAYMENT_VERIFY">Payment Verify</option>
                  <option value="PAYMENT_WEBHOOK">Payment Webhook</option>
                  <option value="UPDATE_USER_ROLE">Update User Role</option>
                  <option value="ENABLE_USER">Enable User</option>
                  <option value="DISABLE_USER">Disable User</option>
                  <option value="DELETE_USER">Delete User</option>
                  <option value="AUTO_HEALTH_CHECK">Auto Health Check</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Success
                </label>
                <select
                  value={success}
                  onChange={(e) => {
                    setSuccess(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="">All</option>
                  <option value="true">Success</option>
                  <option value="false">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-surface-elevated hover:bg-surface-hover text-text-primary rounded-lg font-medium transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-default">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      User Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Success
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface-raised divide-y divide-border-default">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-hover">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {log.userEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {log.action.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                        {log.target}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            log.success
                              ? 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/50'
                              : 'bg-red-500/20 text-red-400 border border-red-500/50'
                          }`}
                        >
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                        {log.ipAddress || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-primary-500 hover:text-primary-600"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="bg-surface-elevated px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} logs
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-surface-raised border border-border-default text-text-primary rounded-lg text-sm font-medium hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 bg-surface-raised border border-border-default text-text-primary rounded-lg text-sm font-medium hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-text-primary">Audit Log Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-text-muted hover:text-text-primary text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-surface-hover transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-surface-elevated p-4 rounded-lg border border-border-default">
                  <h4 className="text-lg font-semibold text-text-primary mb-4">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Timestamp</label>
                      <p className="text-sm text-text-primary">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>

                <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">User Email</label>
                      <p className="text-sm text-text-primary">{selectedLog.userEmail}</p>
                </div>

                <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Action</label>
                      <p className="text-sm text-text-primary font-mono">
                        {selectedLog.action.replace(/_/g, ' ')}
                      </p>
                </div>

                <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Target</label>
                      <p className="text-sm text-text-primary">{selectedLog.target || 'N/A'}</p>
                </div>

                <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedLog.success
                            ? 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/50'
                            : 'bg-red-500/20 text-red-400 border border-red-500/50'
                        }`}
                      >
                        {selectedLog.success ? 'Success' : 'Failed'}
                      </span>
                    </div>

                    {selectedLog.ipAddress && (
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">IP Address</label>
                        <p className="text-sm text-text-primary font-mono">{selectedLog.ipAddress}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {selectedLog.errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-red-400 mb-2">Error Message</label>
                    <p className="text-sm text-red-300">{selectedLog.errorMessage}</p>
                  </div>
                )}

                {/* Context Information */}
                {selectedLog.details && (
                  <div className="bg-surface-elevated p-4 rounded-lg border border-border-default">
                    <h4 className="text-lg font-semibold text-text-primary mb-4">Context & Details</h4>
                    {formatDetailsForDisplay(selectedLog.details)}
                  </div>
                )}

                {/* Raw JSON (Collapsible) */}
                <details className="bg-surface-elevated p-4 rounded-lg border border-border-default">
                  <summary className="cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary mb-2">
                    View Raw JSON
                  </summary>
                  <pre className="bg-surface-base p-4 rounded text-xs overflow-x-auto text-text-primary mt-2 border border-border-default">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

