'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import Navbar from '@/components/Navbar';
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Activity Feed</h1>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.success}
                onChange={(e) => handleFilterChange('success', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="true">Success</option>
                <option value="false">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {activities.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Activity Found</h3>
            <p className="text-gray-600">
              {Object.values(filters).some((f) => f)
                ? 'Try adjusting your filters'
                : 'Your activity will appear here as you use the platform'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="divide-y divide-gray-200">
                {activities.map((activity) => (
                  <div key={activity._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{getActionIcon(activity.action)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {getActionLabel(activity.action)}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                activity.success
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {activity.success ? 'Success' : 'Failed'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(activity.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {activity.storeId && (
                          <p className="text-sm text-gray-600 mb-2">
                            Store: {activity.storeId.storeName} ({activity.storeId.shopDomain})
                          </p>
                        )}
                        {activity.errorMessage && (
                          <p className="text-sm text-red-600 mb-2">
                            Error: {activity.errorMessage}
                          </p>
                        )}
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            <details>
                              <summary className="cursor-pointer text-primary-600 hover:text-primary-700">
                                View Details
                              </summary>
                              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                                {JSON.stringify(activity.details, null, 2)}
                              </pre>
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

