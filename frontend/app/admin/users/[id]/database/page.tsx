'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import {
  ArrowLeft,
  User,
  Store,
  Package,
  CreditCard,
  Wallet,
  FileText,
  History,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Globe,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Truck,
  Box,
  AlertCircle,
  Info,
} from 'lucide-react';

interface ComprehensiveUserData {
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
    storeName: string;
    shopDomain: string;
    status: 'active' | 'invalid' | 'revoked';
    environment: 'development' | 'production';
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  orders: Array<{
    _id: string;
    shopifyOrderName: string;
    shopifyOrderNumber: number;
    email: string;
    totalPrice: number;
    currency: string;
    zenStatus: string;
    financialStatus: string;
    fulfillmentStatus: string | null;
    createdAt: string;
    storeConnectionId?: {
      storeName: string;
      shopDomain: string;
    };
  }>;
  zenOrders: Array<{
    _id: string;
    shopifyOrderName: string;
    storeName: string;
    customerName: string;
    customerEmail: string;
    status: string;
    orderValue: number;
    walletDeductedAmount: number;
    profit: number;
    trackingNumber: string | null;
    courierProvider: string | null;
    createdAt: string;
  }>;
  wallet: {
    _id: string;
    balance: number;
    currency: string;
  } | null;
  walletTransactions: Array<{
    _id: string;
    amount: number;
    type: 'credit' | 'debit';
    reason: string;
    referenceId?: string;
    createdAt: string;
    orderId?: {
      shopifyOrderName: string;
    };
  }>;
  payments: Array<{
    _id: string;
    planCode: string;
    status: string;
    amount: number;
    currency: string;
    createdAt: string;
  }>;
  products: Array<{
    _id: string;
    name: string;
    price: number;
    active: boolean;
    niche?: {
      name: string;
    };
  }>;
  auditLogs: Array<{
    _id: string;
    action: string;
    success: boolean;
    timestamp: string;
    details?: Record<string, any>;
  }>;
  stats: {
    totalStores: number;
    activeStores: number;
    totalOrders: number;
    ordersByStatus: Array<{ _id: string; count: number }>;
    totalZenOrders: number;
    zenOrdersByStatus: Array<{ _id: string; count: number }>;
    walletBalance: number;
    totalWalletTransactions: number;
    totalCredits: number;
    totalDebits: number;
    totalPayments: number;
    successfulPayments: number;
    totalRevenue: number;
    totalProducts: number;
    activeProducts: number;
  };
}

export default function UserDatabasePage() {
  const { user: authUser, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ComprehensiveUserData | null>(null);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    country: '',
    isActive: true,
    plan: null as string | null,
    planExpiresAt: null as string | null,
    isLifetime: false,
  });
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [orderTracking, setOrderTracking] = useState({
    trackingNumber: '',
    trackingUrl: '',
    courierProvider: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && authUser?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, authUser, router]);

  useEffect(() => {
    if (userId && isAuthenticated && authUser?.role === 'admin') {
      fetchData();
    }
  }, [userId, isAuthenticated, authUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: ComprehensiveUserData }>(
        `/api/admin/users/${userId}/comprehensive`
      );
      setData(response.data);
      // Initialize form data
      if (response.data) {
        setUserFormData({
          name: response.data.user.name || '',
          email: response.data.user.email || '',
          mobile: response.data.user.mobile || '',
          country: response.data.user.country || '',
          isActive: response.data.user.isActive,
          plan: response.data.user.plan,
          planExpiresAt: response.data.user.planExpiresAt || null,
          isLifetime: response.data.user.isLifetime,
        });
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      setError(error.response?.data?.message || 'Failed to load user data');
      notify.error(error.response?.data?.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const updateUserInfo = async () => {
    try {
      await api.put(`/api/admin/users/${userId}/update`, userFormData);
      notify.success('User information updated successfully');
      setEditingUser(false);
      fetchData();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to update user information');
    }
  };

  const updateOrderTracking = async (zenOrderId: string) => {
    try {
      await api.post(`/api/admin/zen-orders/${zenOrderId}/tracking`, orderTracking);
      notify.success('Tracking information updated successfully');
      setEditingOrder(null);
      setOrderTracking({ trackingNumber: '', trackingUrl: '', courierProvider: '' });
      fetchData();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to update tracking information');
    }
  };

  const updateOrderZenStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await api.put(`/api/admin/orders/${orderId}/zen-status`, { zenStatus: newStatus });
      notify.success('Order status updated successfully');
      fetchData();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const updateZenOrderStatus = async (zenOrderId: string, newStatus: string, note?: string) => {
    try {
      setUpdatingStatus(zenOrderId);
      await api.post(`/api/admin/zen-orders/${zenOrderId}/status`, { status: newStatus, note });
      notify.success('ZEN order status updated successfully');
      fetchData();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to update ZEN order status');
    } finally {
      setUpdatingStatus(null);
    }
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

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    if (currency === 'INR') {
      return `₹${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
    return `${(amount / 100).toFixed(2)} ${currency}`;
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
      sourcing: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      packing: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      dispatched: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50',
      shipped: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
      failed: 'bg-red-500/20 text-red-400 border-red-500/50',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/50',
      inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
      invalid: 'bg-red-500/20 text-red-400 border-red-500/50',
      revoked: 'bg-red-500/20 text-red-400 border-red-500/50',
    };
    return statusColors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/50';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading user database...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-text-primary mb-4">{error || 'Failed to load user data'}</p>
          <Link
            href="/admin/users"
            className="text-primary-500 hover:text-primary-400"
          >
            ← Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base pb-8">
      {/* Header */}
      <div className="bg-surface-raised border-b border-border-default sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/users/database"
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                  <User className="w-6 h-6" />
                  User Database: {data.user.email || data.user.mobile || 'Unknown'}
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                  Comprehensive view of all user data and activities
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface-raised border border-border-default rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Wallet Balance</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {formatCurrency(data.stats.walletBalance)}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-primary-500" />
            </div>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Orders</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {data.stats.totalOrders}
                </p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">ZEN Orders</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {data.stats.totalZenOrders}
                </p>
              </div>
              <Truck className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Total Revenue</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {formatCurrency(data.stats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="bg-surface-raised border border-border-default rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <User className="w-5 h-5" />
              User Information
            </h2>
            <button
              onClick={() => {
                if (editingUser) {
                  updateUserInfo();
                } else {
                  setEditingUser(true);
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-purple-500/25"
            >
              <Edit className="w-4 h-4" />
              {editingUser ? 'Save Changes' : 'Edit'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-text-secondary uppercase mb-1 block">Email</label>
              {editingUser ? (
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <div className="flex items-center gap-2 text-text-primary">
                  <Mail className="w-4 h-4 text-text-muted" />
                  <span>{data.user.email || 'Not set'}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase mb-1 block">Mobile</label>
              {editingUser ? (
                <input
                  type="tel"
                  value={userFormData.mobile}
                  onChange={(e) => setUserFormData({ ...userFormData, mobile: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <div className="flex items-center gap-2 text-text-primary">
                  <Phone className="w-4 h-4 text-text-muted" />
                  <span>{data.user.mobile || 'Not set'}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase mb-1 block">Name</label>
              {editingUser ? (
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <div className="flex items-center gap-2 text-text-primary">
                  <User className="w-4 h-4 text-text-muted" />
                  <span>{data.user.name || 'Not set'}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase mb-1 block">Country</label>
              {editingUser ? (
                <input
                  type="text"
                  value={userFormData.country}
                  onChange={(e) => setUserFormData({ ...userFormData, country: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <div className="flex items-center gap-2 text-text-primary">
                  <Globe className="w-4 h-4 text-text-muted" />
                  <span>{data.user.country || 'Not set'}</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase mb-1 block">Status</label>
              {editingUser ? (
                <select
                  value={userFormData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setUserFormData({ ...userFormData, isActive: e.target.value === 'active' })}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              ) : (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(data.user.isActive ? 'active' : 'inactive')}`}>
                  {data.user.isActive ? 'Active' : 'Inactive'}
                </span>
              )}
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase mb-1 block">Subscription</label>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(data.user.subscriptionStatus)}`}>
                {data.user.subscriptionStatus === 'lifetime' ? 'Lifetime' : data.user.subscriptionStatus.toUpperCase()}
              </span>
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase mb-1 block">Created</label>
              <div className="flex items-center gap-2 text-text-primary">
                <Clock className="w-4 h-4 text-text-muted" />
                <span>{formatDate(data.user.createdAt)}</span>
              </div>
            </div>
          </div>
          {editingUser && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setEditingUser(false)}
                className="px-4 py-2 bg-surface-elevated hover:bg-surface-hover text-text-primary rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="bg-surface-raised border border-border-default rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Orders ({data.orders.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-elevated">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Store</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">ZEN Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Financial</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {data.orders.map((order) => (
                  <tr key={order._id} className="hover:bg-surface-hover">
                    <td className="px-4 py-3 text-sm text-text-primary">{order.shopifyOrderName}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {order.storeConnectionId?.storeName || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {formatCurrency(order.totalPrice, order.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.zenStatus)}`}>
                        {order.zenStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{order.financialStatus}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.zenStatus}
                        onChange={(e) => updateOrderZenStatus(order._id, e.target.value)}
                        disabled={updatingStatus === order._id}
                        className="text-xs bg-surface-elevated border border-border-default text-text-primary rounded px-2 py-1 focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="shopify">Shopify</option>
                        <option value="awaiting_wallet">Awaiting Wallet</option>
                        <option value="ready_for_fulfillment">Ready for Fulfillment</option>
                        <option value="sourcing">Sourcing</option>
                        <option value="packing">Packing</option>
                        <option value="ready_for_dispatch">Ready for Dispatch</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="shipped">Shipped</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="rto_initiated">RTO Initiated</option>
                        <option value="rto_delivered">RTO Delivered</option>
                        <option value="returned">Returned</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ZEN Orders */}
        <div className="bg-surface-raised border border-border-default rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            ZEN Orders ({data.zenOrders.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-elevated">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Tracking</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {data.zenOrders.map((zenOrder) => (
                  <tr key={zenOrder._id} className="hover:bg-surface-hover">
                    <td className="px-4 py-3 text-sm text-text-primary">{zenOrder.shopifyOrderName}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{zenOrder.customerName}</td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {formatCurrency(zenOrder.orderValue)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(zenOrder.status)}`}>
                        {zenOrder.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {zenOrder.trackingNumber || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(zenOrder.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={zenOrder.status}
                          onChange={(e) => updateZenOrderStatus(zenOrder._id, e.target.value)}
                          disabled={updatingStatus === zenOrder._id}
                          className="text-xs bg-surface-elevated border border-border-default text-text-primary rounded px-2 py-1 focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="sourcing">Sourcing</option>
                          <option value="sourced">Sourced</option>
                          <option value="packing">Packing</option>
                          <option value="packed">Packed</option>
                          <option value="ready_for_dispatch">Ready for Dispatch</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="shipped">Shipped</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="rto_initiated">RTO Initiated</option>
                          <option value="rto_delivered">RTO Delivered</option>
                          <option value="returned">Returned</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="failed">Failed</option>
                        </select>
                        <button
                          onClick={() => {
                            setEditingOrder(zenOrder._id);
                            setOrderTracking({
                              trackingNumber: zenOrder.trackingNumber || '',
                              trackingUrl: '',
                              courierProvider: zenOrder.courierProvider || '',
                            });
                          }}
                          className="px-2 py-1 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded text-xs"
                          title="Update Tracking"
                        >
                          <Truck className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Wallet Transactions */}
        <div className="bg-surface-raised border border-border-default rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Transactions ({data.walletTransactions.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-elevated">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {data.walletTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-surface-hover">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        tx.type === 'credit' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                          : 'bg-red-500/20 text-red-400 border border-red-500/50'
                      }`}>
                        {tx.type === 'credit' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{tx.reason}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {tx.orderId?.shopifyOrderName || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments */}
        <div className="bg-surface-raised border border-border-default rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payments ({data.payments.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-elevated">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {data.payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-surface-hover">
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {payment.planCode.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(payment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stores */}
        <div className="bg-surface-raised border border-border-default rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Store className="w-5 h-5" />
            Stores ({data.stores.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.stores.map((store) => (
              <div
                key={store._id}
                className="p-4 bg-surface-elevated rounded-lg border border-border-default"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-text-primary">{store.storeName}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(store.status)}`}>
                    {store.status}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mb-2">{store.shopDomain}</p>
                <p className="text-xs text-text-muted">{formatDate(store.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tracking Update Modal */}
        {editingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-surface-raised border border-border-default rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-text-primary mb-4">Update Tracking Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={orderTracking.trackingNumber}
                    onChange={(e) => setOrderTracking({ ...orderTracking, trackingNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter tracking number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Tracking URL
                  </label>
                  <input
                    type="url"
                    value={orderTracking.trackingUrl}
                    onChange={(e) => setOrderTracking({ ...orderTracking, trackingUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter tracking URL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Courier Provider
                  </label>
                  <input
                    type="text"
                    value={orderTracking.courierProvider}
                    onChange={(e) => setOrderTracking({ ...orderTracking, courierProvider: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter courier provider"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      setEditingOrder(null);
                      setOrderTracking({ trackingNumber: '', trackingUrl: '', courierProvider: '' });
                    }}
                    className="flex-1 px-4 py-2 bg-surface-elevated hover:bg-surface-hover text-text-primary rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateOrderTracking(editingOrder)}
                    className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
                  >
                    Update Tracking
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

