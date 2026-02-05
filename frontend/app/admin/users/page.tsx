'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import {
  X,
  Mail,
  Phone,
  Globe,
  Calendar,
  Key,
  Store,
  Package,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  User,
  FileText,
  History,
  MapPin,
} from 'lucide-react';

interface User {
  _id: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  storesCount: number;
}

interface UserDetails {
  user: {
    _id: string;
    name?: string;
    email?: string;
    mobile?: string;
    country?: string;
    role: 'admin' | 'user';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastLogin?: string;
    passwordChangedAt?: string;
    emailLinkedAt?: string;
    mobileLinkedAt?: string;
    deletedAt?: string;
    pendingEmail?: string;
    plan: string | null;
    planExpiresAt: string | null;
    isLifetime: boolean;
    subscriptionStatus: 'active' | 'expired' | 'none' | 'lifetime';
    productsAdded: number;
    onboarding?: {
      nicheId: string;
      goal: 'dropship' | 'brand' | 'start_small';
      answeredAt: string;
    };
  };
  stores: Array<{
    _id: string;
    name: string;
    slug: string;
    status: 'active' | 'inactive' | 'suspended';
    currency: string;
    createdAt: string;
    updatedAt: string;
  }>;
  passwordChanges: Array<{
    _id: string;
    action: string;
    timestamp: string;
    success: boolean;
    details?: Record<string, any>;
  }>;
  recentActivity: Array<{
    _id: string;
    action: string;
    timestamp: string;
    success: boolean;
    details?: Record<string, any>;
  }>;
  stats: {
    totalStores: number;
    activeStores: number;
    totalPasswordChanges: number;
    lastPasswordChange: string | null;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminUsersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // User detail modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'admin') return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });

      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get<{
        success: boolean;
        data: { users: User[]; pagination: Pagination };
      }>(`/api/admin/users?${params.toString()}`);

      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.response?.data?.message || 'Failed to load users');
      notify.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, currentPage, search, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      notify.success('User role updated successfully');
      fetchUsers();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.put(`/api/admin/users/${userId}/status`);
      notify.success(`User ${currentStatus ? 'disabled' : 'enabled'} successfully`);
      fetchUsers();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"?\n\nThis will also delete all their stores and cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/api/admin/users/${userId}`);
      notify.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleUserClick = async (userId: string) => {
    setSelectedUserId(userId);
    setLoadingDetails(true);
    try {
      const response = await api.get<{
        success: boolean;
        data: UserDetails;
      }>(`/api/admin/users/${userId}`);
      setUserDetails(response.data);
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      notify.error(error.response?.data?.message || 'Failed to load user details');
      setSelectedUserId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeUserDetails = () => {
    setSelectedUserId(null);
    setUserDetails(null);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading users...</p>
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
              EAZY DROPSHIPPING
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-text-secondary hover:text-primary-500">
                Dashboard
              </Link>
              <Link href="/admin/users" className="text-text-primary font-medium">
                Users
              </Link>
              <Link href="/admin/stores" className="text-text-secondary hover:text-primary-500">
                Stores
              </Link>
              <Link href="/admin/audit" className="text-text-secondary hover:text-primary-500">
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-text-primary">User Management</h1>
            <p className="mt-2 text-text-secondary">Manage all users and their permissions</p>
          </div>

          {/* Filters */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Search Email
                </label>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by email..."
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchInput('');
                    setRoleFilter('');
                    setStatusFilter('');
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 bg-surface-elevated hover:bg-surface-hover text-text-primary rounded-lg font-medium transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-border-default">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-hover"
                      onClick={() => handleSort('email')}
                    >
                      Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-hover"
                      onClick={() => handleSort('role')}
                    >
                      Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-hover"
                      onClick={() => handleSort('createdAt')}
                    >
                      Created {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Stores
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-hover"
                      onClick={() => handleSort('lastLogin')}
                    >
                      Last Login {sortBy === 'lastLogin' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface-raised divide-y divide-border-default">
                  {users.map((userItem) => (
                    <tr
                      key={userItem._id}
                      className="hover:bg-surface-hover cursor-pointer"
                      onClick={() => handleUserClick(userItem._id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                        {userItem.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={userItem.role}
                          onChange={(e) =>
                            handleRoleChange(userItem._id, e.target.value as 'admin' | 'user')
                          }
                          className="text-sm bg-surface-elevated border border-border-default text-text-primary rounded px-2 py-1 focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                        {new Date(userItem.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                        {userItem.storesCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                        {userItem.lastLogin
                          ? new Date(userItem.lastLogin).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            userItem.isActive
                              ? 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/50'
                              : 'bg-red-500/20 text-red-400 border border-red-500/50'
                          }`}
                        >
                          {userItem.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleStatus(userItem._id, userItem.isActive)}
                          className={`${
                            userItem.isActive
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-secondary-400 hover:text-secondary-300'
                          }`}
                        >
                          {userItem.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <Link
                          href={`/admin/stores?userId=${userItem._id}`}
                          className="text-primary-500 hover:text-primary-600"
                        >
                          Stores
                        </Link>
                        <Link
                          href={`/admin/audit?userId=${userItem._id}`}
                          className="text-primary-500 hover:text-primary-600"
                        >
                          Logs
                        </Link>
                        {userItem._id !== user?._id && (
                          <button
                            onClick={() => handleDelete(userItem._id, userItem.email)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        )}
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
                  {pagination.total} users
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

      {/* User Details Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60" onClick={closeUserDetails} />
          <div className="absolute inset-y-0 right-0 w-full max-w-4xl flex">
            <div className="w-full bg-surface-raised border-l border-border-default flex flex-col overflow-hidden animate-slide-in-right">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border-default bg-surface-elevated">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <User className="w-6 h-6" />
                    User Details
                  </h2>
                  {userDetails && (
                    <p className="text-sm text-text-secondary mt-1">
                      {userDetails.user.email || userDetails.user.mobile || 'No contact info'}
                    </p>
                  )}
                </div>
                <button
                  onClick={closeUserDetails}
                  className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                  </div>
                ) : userDetails ? (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-surface-elevated rounded-xl p-5 border border-border-default">
                      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-text-secondary uppercase mb-1 block">Email</label>
                          <div className="flex items-center gap-2 text-text-primary">
                            <Mail className="w-4 h-4 text-text-muted" />
                            <span>{userDetails.user.email || 'Not set'}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-text-secondary uppercase mb-1 block">Mobile</label>
                          <div className="flex items-center gap-2 text-text-primary">
                            <Phone className="w-4 h-4 text-text-muted" />
                            <span>{userDetails.user.mobile || 'Not set'}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-text-secondary uppercase mb-1 block">Name</label>
                          <div className="flex items-center gap-2 text-text-primary">
                            <User className="w-4 h-4 text-text-muted" />
                            <span>{userDetails.user.name || 'Not set'}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-text-secondary uppercase mb-1 block">Country</label>
                          <div className="flex items-center gap-2 text-text-primary">
                            <Globe className="w-4 h-4 text-text-muted" />
                            <span>{userDetails.user.country || 'Not set'}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-text-secondary uppercase mb-1 block">Role</label>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            userDetails.user.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                          }`}>
                            {userDetails.user.role.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <label className="text-xs text-text-secondary uppercase mb-1 block">Status</label>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            userDetails.user.isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                              : 'bg-red-500/20 text-red-400 border border-red-500/50'
                          }`}>
                            {userDetails.user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Account Dates */}
                    <div className="bg-surface-elevated rounded-xl p-5 border border-border-default">
                      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Account Dates
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-text-secondary uppercase mb-1 block">Account Created</label>
                          <div className="flex items-center gap-2 text-text-primary">
                            <Clock className="w-4 h-4 text-text-muted" />
                            <span>{formatDate(userDetails.user.createdAt)}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-text-secondary uppercase mb-1 block">Last Updated</label>
                          <div className="flex items-center gap-2 text-text-primary">
                            <Clock className="w-4 h-4 text-text-muted" />
                            <span>{formatDate(userDetails.user.updatedAt)}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-text-secondary uppercase mb-1 block">Last Login</label>
                          <div className="flex items-center gap-2 text-text-primary">
                            <Clock className="w-4 h-4 text-text-muted" />
                            <span>{formatDate(userDetails.user.lastLogin)}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-text-secondary uppercase mb-1 block">Password Changed</label>
                          <div className="flex items-center gap-2 text-text-primary">
                            <Key className="w-4 h-4 text-text-muted" />
                            <span>{formatDate(userDetails.user.passwordChangedAt)}</span>
                          </div>
                        </div>
                        {userDetails.user.emailLinkedAt && (
                          <div>
                            <label className="text-xs text-text-secondary uppercase mb-1 block">Email Linked</label>
                            <div className="flex items-center gap-2 text-text-primary">
                              <Mail className="w-4 h-4 text-text-muted" />
                              <span>{formatDate(userDetails.user.emailLinkedAt)}</span>
                            </div>
                          </div>
                        )}
                        {userDetails.user.mobileLinkedAt && (
                          <div>
                            <label className="text-xs text-text-secondary uppercase mb-1 block">Mobile Linked</label>
                            <div className="flex items-center gap-2 text-text-primary">
                              <Phone className="w-4 h-4 text-text-muted" />
                              <span>{formatDate(userDetails.user.mobileLinkedAt)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subscription */}
                    <div className="bg-surface-elevated rounded-xl p-5 border border-border-default">
                      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Subscription
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-text-secondary uppercase mb-1 block">Plan</label>
                          <span className="text-text-primary font-medium">
                            {userDetails.user.plan ? userDetails.user.plan.replace('_', ' ').toUpperCase() : 'No Plan'}
                          </span>
                        </div>
                        <div>
                          <label className="text-xs text-text-secondary uppercase mb-1 block">Status</label>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            userDetails.user.subscriptionStatus === 'active' || userDetails.user.subscriptionStatus === 'lifetime'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                              : userDetails.user.subscriptionStatus === 'expired'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                              : 'bg-slate-500/20 text-slate-400 border border-slate-500/50'
                          }`}>
                            {userDetails.user.subscriptionStatus === 'lifetime' ? 'Lifetime' : userDetails.user.subscriptionStatus.toUpperCase()}
                          </span>
                        </div>
                        {userDetails.user.planExpiresAt && (
                          <div>
                            <label className="text-xs text-text-secondary uppercase mb-1 block">Expires At</label>
                            <div className="flex items-center gap-2 text-text-primary">
                              <Calendar className="w-4 h-4 text-text-muted" />
                              <span>{formatDate(userDetails.user.planExpiresAt)}</span>
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="text-xs text-text-secondary uppercase mb-1 block">Products Added</label>
                          <div className="flex items-center gap-2 text-text-primary">
                            <Package className="w-4 h-4 text-text-muted" />
                            <span>{userDetails.user.productsAdded}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stores */}
                    <div className="bg-surface-elevated rounded-xl p-5 border border-border-default">
                      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <Store className="w-5 h-5" />
                        Connected Stores ({userDetails.stats.totalStores})
                      </h3>
                      {userDetails.stores.length === 0 ? (
                        <p className="text-text-secondary text-sm">No stores connected</p>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {userDetails.stores.map((store) => (
                            <div
                              key={store._id}
                              className="flex items-center justify-between p-3 bg-surface-raised rounded-lg border border-border-default"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-text-primary">{store.name}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs border ${
                                    store.status === 'active'
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                                      : store.status === 'suspended'
                                      ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                      : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                                  }`}>
                                    {store.status}
                                  </span>
                                </div>
                                <p className="text-sm text-text-muted">{store.slug}.eazydropshipping.com</p>
                                <p className="text-xs text-text-muted mt-1">
                                  Created: {formatDate(store.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Password Change History */}
                    {userDetails.passwordChanges.length > 0 && (
                      <div className="bg-surface-elevated rounded-xl p-5 border border-border-default">
                        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                          <Key className="w-5 h-5" />
                          Password Change History ({userDetails.stats.totalPasswordChanges})
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userDetails.passwordChanges.map((change) => (
                            <div
                              key={change._id}
                              className="flex items-center justify-between p-2 bg-surface-raised rounded border border-border-default"
                            >
                              <div className="flex items-center gap-2">
                                {change.success ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                                <span className="text-sm text-text-primary">
                                  {change.action.replace('_', ' ')}
                                </span>
                              </div>
                              <span className="text-xs text-text-muted">
                                {formatDate(change.timestamp)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Activity */}
                    {userDetails.recentActivity.length > 0 && (
                      <div className="bg-surface-elevated rounded-xl p-5 border border-border-default">
                        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                          <History className="w-5 h-5" />
                          Recent Activity
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {userDetails.recentActivity.map((activity) => (
                            <div
                              key={activity._id}
                              className="flex items-center justify-between p-2 bg-surface-raised rounded border border-border-default"
                            >
                              <div className="flex items-center gap-2">
                                {activity.success ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                                <span className="text-sm text-text-primary">
                                  {activity.action.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <span className="text-xs text-text-muted">
                                {formatDate(activity.timestamp)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

