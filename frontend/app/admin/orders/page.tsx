'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import ConfirmModal from '@/components/ConfirmModal';
import IconBadge from '@/components/IconBadge';
import {
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Filter,
  Search,
  RefreshCw,
  Store,
  TrendingUp,
  Ban,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  X,
  FileText,
  MapPin,
  User,
  Mail,
  CreditCard,
  ChevronRight,
} from 'lucide-react';

interface StoreOwner {
  _id: string;
  email: string;
  name?: string;
}

interface StoreInfo {
  id: string;
  name: string;
  domain: string;
  owner?: StoreOwner;
}

interface Order {
  id: number;
  name: string;
  orderNumber: number;
  email: string;
  createdAt: string;
  updatedAt: string;
  totalPrice: string;
  subtotalPrice: string;
  totalTax: string;
  currency: string;
  financialStatus: string;
  fulfillmentStatus: string;
  storeId?: string;
  storeName?: string;
  shopDomain?: string;
  customer: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
  } | null;
  lineItems: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
    variantTitle: string;
    sku: string;
  }>;
  shippingAddress: {
    address1: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    formatted: string;
  } | null;
}

interface StoreStat {
  storeId: string;
  storeName: string;
  shopDomain: string;
  owner: StoreOwner;
  totalOrders: number;
  totalRevenue: number;
  paidRevenue?: number;
  currency: string;
  error?: string;
}

interface AggregatedStats {
  totalOrders: number;
  totalRevenue: number;
  paidRevenue?: number;
  storeStats: StoreStat[];
}

interface RevenueData {
  stores: Array<{
    storeId: string;
    storeName: string;
    shopDomain: string;
    owner: StoreOwner;
    totalOrders: number;
    totalRevenue: number;
    revenueByStatus: { paid: number; pending: number; refunded: number };
    currency: string;
    ordersByFulfillment: { unfulfilled: number; fulfilled: number; partial: number };
    error?: string;
  }>;
  totals: {
    totalRevenue: number;
    totalOrders: number;
    totalStores: number;
    activeStores: number;
  };
}

// Date presets
const datePresets = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7days' },
  { label: 'Last 30 days', value: '30days' },
  { label: 'Last 90 days', value: '90days' },
  { label: 'This month', value: 'thisMonth' },
  { label: 'Last month', value: 'lastMonth' },
  { label: 'All time', value: 'all' },
];

function getDateRange(preset: string): { startDate: string; endDate: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'today':
      return {
        startDate: today.toISOString(),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      };
    case '7days':
      return {
        startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: now.toISOString(),
      };
    case '30days':
      return {
        startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: now.toISOString(),
      };
    case '90days':
      return {
        startDate: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: now.toISOString(),
      };
    case 'thisMonth':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        endDate: now.toISOString(),
      };
    case 'lastMonth':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
        endDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      };
    default:
      return { startDate: '', endDate: '' };
  }
}

export default function AdminOrdersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState('30days');
  
  // View mode
  const [viewMode, setViewMode] = useState<'orders' | 'revenue'>('orders');
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  
  // Order detail
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [fulfillNote, setFulfillNote] = useState('');
  
  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; action: string; order: Order | null }>({
    isOpen: false,
    action: '',
    order: null,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchAllOrders = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    
    try {
      setLoading(true);
      setError('');
      
      const { startDate, endDate } = getDateRange(datePreset);
      
      let url = '/api/orders/admin/all?limit=100';
      if (selectedStore !== 'all') {
        url += `&storeId=${selectedStore}`;
      }
      if (startDate) {
        url += `&startDate=${encodeURIComponent(startDate)}`;
      }
      if (endDate) {
        url += `&endDate=${encodeURIComponent(endDate)}`;
      }
      
      const response = await api.get<{
        success: boolean;
        data: Order[];
        stores: StoreInfo[];
        aggregatedStats: AggregatedStats;
      }>(url);
      
      setOrders(response.data);
      setStores(response.stores);
      setAggregatedStats(response.aggregatedStats);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.error || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, selectedStore, datePreset]);

  const fetchRevenueData = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    
    try {
      setRevenueLoading(true);
      
      const { startDate, endDate } = getDateRange(datePreset);
      let url = '/api/orders/admin/revenue';
      const params = [];
      if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
      if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
      if (params.length) url += '?' + params.join('&');
      
      const response = await api.get<{
        success: boolean;
        data: RevenueData;
      }>(url);
      
      setRevenueData(response.data);
    } catch (error: any) {
      console.error('Error fetching revenue:', error);
    } finally {
      setRevenueLoading(false);
    }
  }, [isAuthenticated, user, datePreset]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchAllOrders();
      fetchRevenueData();
    }
  }, [fetchAllOrders, fetchRevenueData, isAuthenticated, user]);

  const handleOrderAction = async (action: string, orderId: number, storeId: string) => {
    try {
      setActionLoading(true);
      await api.put(`/api/orders/${storeId}/${orderId}`, { action });
      notify.success(`Order ${action}ed successfully`);
      await fetchAllOrders();
      setSelectedOrder(null);
    } catch (error: any) {
      notify.error(error.response?.data?.error || `Failed to ${action} order`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFulfillOrder = async (order: Order) => {
    if (!order.storeId) return;
    
    try {
      setActionLoading(true);
      await api.post(`/api/orders/${order.storeId}/${order.id}/fulfill`, {
        note: fulfillNote || undefined,
        notifyCustomer: true,
      });
      notify.success('Order fulfilled successfully');
      setFulfillNote('');
      await fetchAllOrders();
      setSelectedOrder(null);
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to fulfill order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkCompleted = async (order: Order) => {
    if (!order.storeId) return;
    
    try {
      setActionLoading(true);
      await api.post(`/api/orders/${order.storeId}/${order.id}/complete`, {
        paymentReceived: true,
        note: 'Marked as completed by admin',
      });
      notify.success('Order marked as completed & paid!');
      await fetchAllOrders();
      setSelectedOrder(null);
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to mark order as completed');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStoreExpand = (storeId: string) => {
    const newExpanded = new Set(expandedStores);
    if (newExpanded.has(storeId)) {
      newExpanded.delete(storeId);
    } else {
      newExpanded.add(storeId);
    }
    setExpandedStores(newExpanded);
  };

  const getFinancialStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
      refunded: 'bg-rose-500/20 text-rose-400 border-rose-500/50',
      partially_refunded: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      voided: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
    };
    
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const getFulfillmentStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
      fulfilled: { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50', icon: <CheckCircle className="w-3.5 h-3.5" /> },
      unfulfilled: { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/50', icon: <Clock className="w-3.5 h-3.5" /> },
      partial: { bg: 'bg-sky-500/20 text-sky-400 border-sky-500/50', icon: <Package className="w-3.5 h-3.5" /> },
    };
    
    const style = styles[status] || styles.unfulfilled;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg}`}>
        {style.icon}
        {status.replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const formatCurrency = (amount: number | string, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.name.toLowerCase().includes(term) ||
      order.email?.toLowerCase().includes(term) ||
      order.customer?.fullName?.toLowerCase().includes(term) ||
      order.orderNumber.toString().includes(term) ||
      order.storeName?.toLowerCase().includes(term)
    );
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Nav */}
      <nav className="bg-surface-raised border-b border-border-default">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/admin/dashboard" className="text-2xl font-bold text-primary-500">Admin Panel</Link>
            <div className="flex items-center gap-4">
              <Link href="/admin/stores" className="text-text-secondary hover:text-primary-500">Stores</Link>
              <Link href="/admin/revenue" className="text-text-secondary hover:text-primary-500">Revenue</Link>
              <span className="text-text-secondary">{user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                  <ShoppingCart className="w-8 h-8 text-primary-500" />
                  All Store Orders
                </h1>
                <p className="mt-2 text-text-secondary">Manage orders across all stores</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-surface-elevated border border-border-default rounded-lg p-1 flex">
                  <button
                    onClick={() => setViewMode('orders')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'orders' ? 'bg-primary-500 text-black' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Orders
                  </button>
                  <button
                    onClick={() => setViewMode('revenue')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'revenue' ? 'bg-primary-500 text-black' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Revenue
                  </button>
                </div>
                
                <button
                  onClick={() => { fetchAllOrders(); fetchRevenueData(); }}
                  disabled={loading || revenueLoading}
                  className="p-2 bg-surface-elevated border border-border-default rounded-lg hover:bg-surface-hover disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 text-text-secondary ${loading || revenueLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Global Stats */}
          {aggregatedStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm font-medium">Paid Revenue</span>
                </div>
                <p className="text-2xl font-bold text-text-primary">
                  {formatCurrency(aggregatedStats.paidRevenue || aggregatedStats.totalRevenue)}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 text-sky-400 mb-1">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-sm font-medium">Total Orders</span>
                </div>
                <p className="text-2xl font-bold text-text-primary">{aggregatedStats.totalOrders}</p>
              </div>
              
              <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 text-violet-400 mb-1">
                  <Store className="w-5 h-5" />
                  <span className="text-sm font-medium">Active Stores</span>
                </div>
                <p className="text-2xl font-bold text-text-primary">{aggregatedStats.storeStats.filter(s => !s.error).length}</p>
              </div>
              
              <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 text-amber-400 mb-1">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-medium">Avg. Paid Order</span>
                </div>
                <p className="text-2xl font-bold text-text-primary">
                  {aggregatedStats.totalOrders > 0 
                    ? formatCurrency((aggregatedStats.paidRevenue || aggregatedStats.totalRevenue) / aggregatedStats.totalOrders) 
                    : '$0'}
                </p>
              </div>
            </div>
          )}

          {viewMode === 'orders' ? (
            <>
              {/* Filters */}
              <div className="bg-surface-raised border border-border-default rounded-xl p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-text-secondary" />
                      <select
                        value={datePreset}
                        onChange={(e) => setDatePreset(e.target.value)}
                        className="px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg text-sm"
                      >
                        {datePresets.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-text-secondary" />
                      <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg text-sm min-w-[160px]"
                      >
                        <option value="all">All Stores</option>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 text-sm text-text-secondary">
                  Showing <strong className="text-text-primary">{filteredOrders.length}</strong> of {orders.length} orders
                </div>
              </div>

              {error && (
                <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">{error}</div>
              )}

              {/* Orders Table */}
              {filteredOrders.length === 0 ? (
                <div className="bg-surface-raised border border-border-default rounded-xl p-12 text-center space-y-4">
                  <div className="flex justify-center">
                    <IconBadge label="No orders" icon={ShoppingCart} size="lg" variant="neutral" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary">No orders found</h3>
                  <p className="text-text-secondary">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-full divide-y divide-border-default">
                      <thead className="bg-surface-elevated">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Order</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Store</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Customer</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Total</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Date</th>
                          <th className="px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {filteredOrders.map((order) => (
                          <tr
                            key={`${order.storeId}-${order.id}`}
                            className="hover:bg-surface-hover transition-colors cursor-pointer"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <td className="px-6 py-4">
                              <div className="font-semibold text-text-primary">{order.name}</div>
                              <div className="text-sm text-text-muted">{order.lineItems.length} items</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-text-primary">{order.storeName}</div>
                              <div className="text-xs text-text-muted">{order.shopDomain}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-text-primary">{order.customer?.fullName || 'Guest'}</div>
                              <div className="text-sm text-text-muted">{order.email}</div>
                            </td>
                            <td className="px-6 py-4 font-semibold text-text-primary">
                              {formatCurrency(order.totalPrice, order.currency)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                {getFinancialStatusBadge(order.financialStatus)}
                                {getFulfillmentStatusBadge(order.fulfillmentStatus)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-text-muted">{formatDate(order.createdAt)}</td>
                            <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                              <button onClick={() => setSelectedOrder(order)} className="p-2 hover:bg-surface-elevated rounded-lg">
                                <ChevronRight className="w-5 h-5 text-text-secondary" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Revenue View */
            <div className="space-y-6">
              {/* Date Filter for Revenue */}
              <div className="bg-surface-raised border border-border-default rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-text-secondary" />
                  <span className="text-text-secondary">Period:</span>
                  <select
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value)}
                    className="px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg"
                  >
                    {datePresets.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              {revenueLoading ? (
                <div className="bg-surface-raised border border-border-default rounded-xl p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-4 text-text-secondary">Loading revenue...</p>
                </div>
              ) : revenueData ? (
                <>
                  {/* Revenue Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-5">
                      <div className="flex items-center gap-2 text-emerald-400 mb-1">
                        <CreditCard className="w-5 h-5" />
                        <span className="text-sm font-medium">Paid Revenue</span>
                      </div>
                      <p className="text-2xl font-bold text-text-primary">
                        {formatCurrency(revenueData.stores.reduce((sum, s) => sum + s.revenueByStatus.paid, 0))}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-5">
                      <div className="flex items-center gap-2 text-amber-400 mb-1">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm font-medium">Pending</span>
                      </div>
                      <p className="text-2xl font-bold text-text-primary">
                        {formatCurrency(revenueData.stores.reduce((sum, s) => sum + s.revenueByStatus.pending, 0))}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/30 rounded-xl p-5">
                      <div className="flex items-center gap-2 text-rose-400 mb-1">
                        <XCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Refunded</span>
                      </div>
                      <p className="text-2xl font-bold text-text-primary">
                        {formatCurrency(revenueData.stores.reduce((sum, s) => sum + s.revenueByStatus.refunded, 0))}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/30 rounded-xl p-5">
                      <div className="flex items-center gap-2 text-violet-400 mb-1">
                        <Building2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Active Stores</span>
                      </div>
                      <p className="text-2xl font-bold text-text-primary">
                        {revenueData.totals.activeStores} / {revenueData.totals.totalStores}
                      </p>
                    </div>
                  </div>

                  {/* Store Breakdown */}
                  <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border-default bg-surface-elevated">
                      <h3 className="font-semibold text-text-primary flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary-500" />
                        Store-wise Revenue
                      </h3>
                    </div>
                    
                    <div className="divide-y divide-border-default">
                      {revenueData.stores.map((store) => (
                        <div key={store.storeId}>
                          <div
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-hover"
                            onClick={() => toggleStoreExpand(store.storeId)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-primary-500/10 border border-primary-500/30 flex items-center justify-center">
                                <Store className="w-5 h-5 text-primary-400" />
                              </div>
                              <div>
                                <div className="font-semibold text-text-primary">{store.storeName}</div>
                                <div className="text-sm text-text-muted">{store.shopDomain}</div>
                                <div className="text-xs text-text-muted">Owner: {store.owner?.email || 'N/A'}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-8">
                              <div className="text-right">
                                <div className="text-sm text-text-secondary">Revenue</div>
                                <div className="text-xl font-bold text-emerald-400">{formatCurrency(store.totalRevenue, store.currency)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-text-secondary">Orders</div>
                                <div className="text-xl font-bold text-text-primary">{store.totalOrders}</div>
                              </div>
                              {expandedStores.has(store.storeId) ? <ChevronUp className="w-5 h-5 text-text-secondary" /> : <ChevronDown className="w-5 h-5 text-text-secondary" />}
                            </div>
                          </div>
                          
                          {expandedStores.has(store.storeId) && (
                            <div className="px-4 pb-4 bg-surface-elevated border-t border-border-default">
                              <div className="pt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                <div className="bg-surface-raised rounded-lg p-3">
                                  <div className="text-xs text-emerald-400 mb-1">Paid</div>
                                  <div className="font-semibold text-text-primary">{formatCurrency(store.revenueByStatus.paid, store.currency)}</div>
                                </div>
                                <div className="bg-surface-raised rounded-lg p-3">
                                  <div className="text-xs text-amber-400 mb-1">Pending</div>
                                  <div className="font-semibold text-text-primary">{formatCurrency(store.revenueByStatus.pending, store.currency)}</div>
                                </div>
                                <div className="bg-surface-raised rounded-lg p-3">
                                  <div className="text-xs text-rose-400 mb-1">Refunded</div>
                                  <div className="font-semibold text-text-primary">{formatCurrency(store.revenueByStatus.refunded, store.currency)}</div>
                                </div>
                                <div className="bg-surface-raised rounded-lg p-3">
                                  <div className="text-xs text-amber-400 mb-1">Unfulfilled</div>
                                  <div className="font-semibold text-text-primary">{store.ordersByFulfillment.unfulfilled}</div>
                                </div>
                                <div className="bg-surface-raised rounded-lg p-3">
                                  <div className="text-xs text-emerald-400 mb-1">Fulfilled</div>
                                  <div className="font-semibold text-text-primary">{store.ordersByFulfillment.fulfilled}</div>
                                </div>
                                <div className="bg-surface-raised rounded-lg p-3">
                                  <div className="text-xs text-sky-400 mb-1">Partial</div>
                                  <div className="font-semibold text-text-primary">{store.ordersByFulfillment.partial}</div>
                                </div>
                              </div>
                              {store.error && (
                                <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">Error: {store.error}</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-surface-raised border border-border-default rounded-xl p-12 text-center">
                  <IconBadge label="No data" icon={BarChart3} size="lg" variant="neutral" />
                  <h3 className="text-xl font-semibold text-text-primary mt-4">No revenue data</h3>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Slide-over */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedOrder(null)} />
          
          <div className="absolute inset-y-0 right-0 w-full max-w-xl flex">
            <div className="w-full bg-surface-raised border-l border-border-default flex flex-col overflow-hidden animate-slide-in-right">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border-default bg-surface-elevated">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{selectedOrder.name}</h2>
                  <p className="text-sm text-text-secondary">{selectedOrder.storeName} • {formatDate(selectedOrder.createdAt)}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-surface-hover rounded-lg">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status */}
                <div className="flex flex-wrap gap-3">
                  <div>
                    <p className="text-xs text-text-secondary uppercase mb-1">Payment</p>
                    {getFinancialStatusBadge(selectedOrder.financialStatus)}
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary uppercase mb-1">Fulfillment</p>
                    {getFulfillmentStatusBadge(selectedOrder.fulfillmentStatus)}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-surface-elevated rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Package className="w-4 h-4" /> Quick Actions
                  </h3>
                  
                  {selectedOrder.fulfillmentStatus !== 'fulfilled' && selectedOrder.storeId && (
                    <div className="space-y-2">
                      <textarea
                        value={fulfillNote}
                        onChange={(e) => setFulfillNote(e.target.value)}
                        placeholder="Add a fulfillment note (optional)..."
                        className="w-full px-3 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg text-sm resize-none"
                        rows={2}
                      />
                      <button
                        onClick={() => handleFulfillOrder(selectedOrder)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50"
                      >
                        <Truck className="w-4 h-4" />
                        {actionLoading ? 'Fulfilling...' : 'Mark as Fulfilled'}
                      </button>
                    </div>
                  )}
                  
                  {selectedOrder.storeId && (
                    <>
                      {/* Mark as Completed & Paid Button */}
                      {selectedOrder.fulfillmentStatus === 'fulfilled' && (
                        <button
                          onClick={() => handleMarkCompleted(selectedOrder)}
                          disabled={actionLoading}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg transition-all font-medium disabled:opacity-50"
                        >
                          <DollarSign className="w-4 h-4" />
                          {actionLoading ? 'Processing...' : 'Mark as Completed & Paid'}
                        </button>
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOrderAction('close', selectedOrder.id, selectedOrder.storeId!)}
                          disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-surface-base hover:bg-surface-hover border border-border-default text-text-primary rounded-lg text-sm disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Close
                        </button>
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, action: 'cancel', order: selectedOrder })}
                          disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg text-sm disabled:opacity-50"
                        >
                          <Ban className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Customer */}
                <div className="bg-surface-elevated rounded-xl p-4">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-3">
                    <User className="w-4 h-4" /> Customer
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <User className="w-4 h-4" />
                      <span>{selectedOrder.customer?.fullName || 'Guest'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Mail className="w-4 h-4" />
                      <span>{selectedOrder.email}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping */}
                {selectedOrder.shippingAddress && (
                  <div className="bg-surface-elevated rounded-xl p-4">
                    <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4" /> Shipping Address
                    </h3>
                    <p className="text-text-secondary">{selectedOrder.shippingAddress.formatted}</p>
                  </div>
                )}

                {/* Items */}
                <div className="bg-surface-elevated rounded-xl p-4">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4" /> Items ({selectedOrder.lineItems.length})
                  </h3>
                  <div className="divide-y divide-border-default">
                    {selectedOrder.lineItems.map(item => (
                      <div key={item.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-text-primary">{item.title}</p>
                          {item.variantTitle && <p className="text-sm text-text-muted">{item.variantTitle}</p>}
                          <p className="text-sm text-text-secondary">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-text-primary">{formatCurrency(item.price, selectedOrder.currency)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-surface-elevated rounded-xl p-4">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4" /> Order Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-text-secondary">
                      <span>Subtotal</span>
                      <span>{formatCurrency(selectedOrder.subtotalPrice, selectedOrder.currency)}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Tax</span>
                      <span>{formatCurrency(selectedOrder.totalTax, selectedOrder.currency)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-text-primary text-lg pt-2 border-t border-border-default">
                      <span>Total</span>
                      <span>{formatCurrency(selectedOrder.totalPrice, selectedOrder.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This will notify the customer and cannot be undone."
        confirmText="Cancel Order"
        cancelText="Go Back"
        variant="danger"
        onConfirm={() => {
          if (confirmModal.order?.storeId) {
            handleOrderAction('cancel', confirmModal.order.id, confirmModal.order.storeId);
          }
          setConfirmModal({ isOpen: false, action: '', order: null });
        }}
        onCancel={() => setConfirmModal({ isOpen: false, action: '', order: null })}
      />

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
