'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import Pagination from '@/components/Pagination';

interface Activity {
  _id: string;
  action: string;
  success: boolean;
  errorMessage?: string;
  details?: any;
  timestamp: string;
  storeId?: {
    _id: string;
    storeName: string;
    shopDomain: string;
  };
}

export default function ActivityPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    success: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActivity();
    }
  }, [isAuthenticated, pagination.page, filters]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (filters.action) params.append('action', filters.action);
      if (filters.success) params.append('success', filters.success);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get<{
        success: boolean;
        data: Activity[];
        pagination: typeof pagination;
      }>(`/api/activity?${params.toString()}`);
      setActivities(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError('Failed to load activity');
      notify.error('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
    setPagination({ ...pagination, page: 1 }); // Reset to page 1 when filtering
  };

  const getActionIcon = (action: string) => {
    if (action.includes('STORE')) return '🏪';
    if (action.includes('USER')) return '👤';
    if (action.includes('NICHE')) return '📦';
    if (action.includes('TEST')) return '🔍';
    return '📝';
  };

  const getActionLabel = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDetails = (details: any): string => {
    if (!details || typeof details !== 'object') {
      return String(details || '');
    }

    const formatValue = (value: any, indent = 0): string => {
      const prefix = '  '.repeat(indent);
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        return value.map((item, idx) => 
          `${prefix}  ${idx + 1}. ${formatValue(item, indent + 1)}`
        ).join('\n');
      }
      if (typeof value === 'object') {
        const entries = Object.entries(value);
        if (entries.length === 0) return '{}';
        return entries.map(([key, val]) => 
          `${prefix}${key}: ${formatValue(val, indent + 1)}`
        ).join('\n');
      }
      return String(value);
    };

    return formatValue(details, 0);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-base">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-text-primary mb-6">Activity Feed</h1>

        {/* Filters */}
        <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Filters</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Action Type
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Actions</option>
                <option value="CREATE_STORE">Create Store</option>
                <option value="UPDATE_STORE">Update Store</option>
                <option value="DELETE_STORE">Delete Store</option>
                <option value="TEST_STORE">Test Store</option>
                <option value="SET_DEFAULT_STORE">Set Default Store</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Status
              </label>
              <select
                value={filters.success}
                onChange={(e) => handleFilterChange('success', e.target.value)}
                className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {activities.length === 0 ? (
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No Activity Found</h3>
            <p className="text-text-secondary">
              {Object.values(filters).some((f) => f)
                ? 'Try adjusting your filters'
                : 'Your activity will appear here as you use the platform'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md overflow-hidden">
              <div className="divide-y divide-border-default">
                {activities.map((activity) => (
                  <div key={activity._id} className="p-6 hover:bg-surface-hover transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{getActionIcon(activity.action)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-text-primary">
                            {getActionLabel(activity.action)}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                activity.success
                                  ? 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/50'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/50'
                              }`}
                            >
                              {activity.success ? 'Success' : 'Failed'}
                            </span>
                            <span className="text-sm text-text-muted">
                              {new Date(activity.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {activity.storeId && (
                          <p className="text-sm text-text-secondary mb-2">
                            Store: {activity.storeId.storeName} ({activity.storeId.shopDomain})
                          </p>
                        )}
                        {activity.errorMessage && (
                          <p className="text-sm text-red-400 mb-2">
                            Error: {activity.errorMessage}
                          </p>
                        )}
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <div className="mt-2 text-sm text-text-secondary">
                            <details>
                              <summary className="cursor-pointer text-primary-500 hover:text-primary-600">
                                View Details
                              </summary>
                              <div className="mt-2 p-3 bg-surface-elevated rounded text-xs overflow-auto text-text-primary whitespace-pre-wrap font-mono">
                                {formatDetails(activity.details)}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {pagination.pages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  onPageChange={(page) =>
                    setPagination({ ...pagination, page })
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

