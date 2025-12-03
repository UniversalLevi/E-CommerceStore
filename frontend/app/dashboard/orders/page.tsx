'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import ConfirmModal from '@/components/ConfirmModal';
import IconBadge from '@/components/IconBadge';
import SubscriptionLock from '@/components/SubscriptionLock';
import { useSubscription } from '@/hooks/useSubscription';
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
  Eye,
  Ban,
  Calendar,
  X,
  FileText,
  MapPin,
  User,
  Mail,
  CreditCard,
  ChevronRight,
  Wallet,
  Zap,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import WalletWidget from '@/components/WalletWidget';
import { openRazorpayCheckout } from '@/lib/razorpay';

interface StoreConnection {
  _id: string;
  storeName: string;
  shopDomain: string;
  status: 'active' | 'invalid' | 'revoked';
  isDefault: boolean;
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

interface OrderStats {
  totalRevenue: number;
  paidRevenue: number;
  currency: string;
  ordersByStatus: {
    pending: number;
    paid: number;
    authorized?: number;
    refunded: number;
    partially_refunded?: number;
    voided?: number;
    unfulfilled: number;
    fulfilled: number;
    partial: number;
  };
}

// Date range presets
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

export default function OrdersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  const router = useRouter();
  
  const [stores, setStores] = useState<StoreConnection[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [fulfillmentFilter, setFulfillmentFilter] = useState('any');
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState('30days');
  
  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [fulfillNote, setFulfillNote] = useState('');
  
  // Confirmation modal
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; action: string; orderId: number | null }>({
    isOpen: false,
    action: '',
    orderId: null,
  });
  
  // ZEN Fulfillment state
  const [zenLoading, setZenLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [insufficientData, setInsufficientData] = useState<{
    shortage: number;
    shortageFormatted: string;
    requiredAmount: number;
    requiredAmountFormatted: string;
  } | null>(null);
  const [processedZenOrders, setProcessedZenOrders] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Check subscription before rendering
  if (!authLoading && isAuthenticated && !hasActiveSubscription) {
    return <SubscriptionLock featureName="Order Management" />;
  }

  const fetchStores = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.get<{ success: boolean; data: StoreConnection[] }>('/api/stores');
      const activeStores = response.data.filter(s => s.status === 'active');
      setStores(activeStores);
      
      if (activeStores.length > 0) {
        const defaultStore = activeStores.find(s => s.isDefault) || activeStores[0];
        setSelectedStore(defaultStore._id);
      }
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      setError(error.response?.data?.error || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchOrders = useCallback(async () => {
    if (!selectedStore) return;
    
    try {
      setOrdersLoading(true);
      setError('');
      
      const { startDate, endDate } = getDateRange(datePreset);
      
      let url = `/api/orders/${selectedStore}?limit=100`;
      if (fulfillmentFilter !== 'any') {
        url += `&fulfillmentStatus=${fulfillmentFilter}`;
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
        stats: OrderStats;
        store: { id: string; name: string; domain: string };
      }>(url);
      
      setOrders(response.data);
      setStats(response.stats);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.error || 'Failed to load orders');
      setOrders([]);
      setStats(null);
    } finally {
      setOrdersLoading(false);
    }
  }, [selectedStore, fulfillmentFilter, datePreset]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    if (selectedStore) {
      fetchOrders();
    }
  }, [selectedStore, fetchOrders]);

  const handleOrderAction = async (action: string, orderId: number) => {
    try {
      setActionLoading(true);
      await api.put(`/api/orders/${selectedStore}/${orderId}`, { action });
      notify.success(`Order ${action}ed successfully`);
      await fetchOrders();
      setSelectedOrder(null);
    } catch (error: any) {
      notify.error(error.response?.data?.error || `Failed to ${action} order`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFulfillOrder = async (orderId: number) => {
    try {
      setActionLoading(true);
      await api.post(`/api/orders/${selectedStore}/${orderId}/fulfill`, {
        note: fulfillNote || undefined,
        notifyCustomer: true,
      });
      notify.success('Order fulfilled successfully');
      setFulfillNote('');
      await fetchOrders();
      setSelectedOrder(null);
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to fulfill order');
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    try {
      const response = await api.getWallet();
      if (response.success) {
        setWalletBalance(response.data.balance);
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWalletBalance();
    }
  }, [isAuthenticated, fetchWalletBalance]);

  // Handle ZEN Fulfillment
  const handleFulfillViaZen = async (orderId: number) => {
    if (!selectedOrder) return;

    // Calculate product cost from order subtotal (convert to paise)
    const productCostPaise = Math.round(parseFloat(selectedOrder.subtotalPrice || '0') * 100);

    if (!productCostPaise || productCostPaise <= 0) {
      notify.error('Order has no product cost');
      return;
    }

    try {
      setZenLoading(true);
      const response = await api.fulfillViaZen(selectedStore, orderId.toString(), {
        productCost: productCostPaise,
        shippingCost: 0, // No shipping cost
      });

      if (response.success) {
        notify.success(`Order submitted for ZEN fulfillment! ${response.data.walletDeductedFormatted} deducted.`);
        // Track this order as processed
        setProcessedZenOrders(prev => new Set([...prev, orderId]));
        await fetchOrders();
        await fetchWalletBalance();
        setSelectedOrder(null);
      } else if (response.reason === 'insufficient_balance') {
        // Show insufficient balance modal
        setInsufficientData({
          shortage: response.data.shortage || 0,
          shortageFormatted: response.data.shortageFormatted || '₹0',
          requiredAmount: response.data.requiredAmount || 0,
          requiredAmountFormatted: response.data.requiredAmountFormatted || '₹0',
        });
        setShowInsufficientModal(true);
      }
    } catch (error: any) {
      if (error.response?.status === 402 && error.response?.data?.reason === 'insufficient_balance') {
        setInsufficientData({
          shortage: error.response.data.data?.shortage || 0,
          shortageFormatted: error.response.data.data?.shortageFormatted || '₹0',
          requiredAmount: error.response.data.data?.requiredAmount || 0,
          requiredAmountFormatted: error.response.data.data?.requiredAmountFormatted || '₹0',
        });
        setShowInsufficientModal(true);
      } else if (error.response?.status === 400 && error.response?.data?.error?.includes('already been processed')) {
        // Order was already processed via ZEN - show info message
        notify.success('This order has already been submitted for ZEN fulfillment.');
        // Track this order as processed
        setProcessedZenOrders(prev => new Set([...prev, orderId]));
        setSelectedOrder(null);
        await fetchOrders();
      } else {
        notify.error(error.response?.data?.error || 'Failed to submit for ZEN fulfillment');
      }
    } finally {
      setZenLoading(false);
    }
  };

  // Handle quick topup from insufficient balance modal
  const handleQuickTopup = async (amount: number) => {
    try {
      const orderResponse = await api.createWalletTopupOrder(amount);
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error('Failed to create topup order');
      }

      const { orderId, amount: orderAmount, currency, keyId } = orderResponse.data;

      await openRazorpayCheckout(
        {
          key: keyId,
          amount: orderAmount,
          currency,
          name: 'EAZY DROPSHIPPING',
          description: 'Wallet Top-up',
          order_id: orderId,
          theme: { color: '#22c55e' },
        },
        async (response) => {
          try {
            const verifyResponse = await api.verifyWalletTopup({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.success) {
              notify.success(`${verifyResponse.data.amountFormatted} added to wallet!`);
              await fetchWalletBalance();
              setShowInsufficientModal(false);
            }
          } catch (err: any) {
            notify.error(err?.message || 'Payment verification failed');
          }
        },
        (error) => {
          notify.error(error?.message || 'Payment cancelled');
        }
      );
    } catch (error: any) {
      notify.error(error?.message || 'Failed to initiate topup');
    }
  };

  const handleMarkCompleted = async (orderId: number) => {
    try {
      setActionLoading(true);
      const response = await api.post<{ 
        success: boolean; 
        message: string; 
        data: { paymentMarked: boolean } 
      }>(`/api/orders/${selectedStore}/${orderId}/complete`, {
        paymentReceived: true,
        note: 'Marked as completed via dashboard',
      });
      
      if (response.data?.paymentMarked) {
        notify.success('Order marked as completed & paid! Revenue updated.');
      } else {
        notify.success(response.message || 'Order marked as completed');
      }
      await fetchOrders();
      setSelectedOrder(null);
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to mark order as completed');
    } finally {
      setActionLoading(false);
    }
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

  const formatCurrency = (amount: string | number, currency: string) => {
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

  // Filter orders based on search
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.name.toLowerCase().includes(term) ||
      order.email?.toLowerCase().includes(term) ||
      order.customer?.fullName?.toLowerCase().includes(term) ||
      order.orderNumber.toString().includes(term)
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                  <ShoppingCart className="w-8 h-8 text-primary-500" />
                  Order Management
                </h1>
                <p className="mt-2 text-text-secondary">
                  Manage orders, fulfillments, and track revenue
                </p>
              </div>
              
              {stores.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-text-secondary" />
                    <select
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.target.value)}
                      className="px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 min-w-[180px]"
                    >
                      {stores.map(store => (
                        <option key={store._id} value={store._id}>
                          {store.storeName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={fetchOrders}
                    disabled={ordersLoading}
                    className="p-2 bg-surface-elevated border border-border-default rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-5 h-5 text-text-secondary ${ordersLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {stores.length === 0 ? (
            <div className="bg-surface-raised border border-border-default rounded-xl p-12 text-center space-y-4">
              <div className="flex justify-center">
                <IconBadge label="No stores" icon={Store} size="lg" variant="neutral" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary">No stores connected</h3>
              <p className="text-text-secondary">Connect a Shopify store to start managing orders</p>
              <Link
                href="/dashboard/stores/connect"
                className="inline-block bg-primary-500 hover:bg-primary-600 text-black px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Connect Store
              </Link>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Paid Revenue</span>
                    </div>
                    <p className="text-xl font-bold text-text-primary">
                      {formatCurrency(stats.paidRevenue || stats.totalRevenue, stats.currency)}
                    </p>
                  </div>
                  
                  <div className="bg-surface-raised border border-border-default rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-400 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Pending</span>
                    </div>
                    <p className="text-xl font-bold text-text-primary">{stats.ordersByStatus.pending}</p>
                  </div>
                  
                  <div className="bg-surface-raised border border-border-default rounded-xl p-4">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Paid</span>
                    </div>
                    <p className="text-xl font-bold text-text-primary">{stats.ordersByStatus.paid}</p>
                  </div>
                  
                  <div className="bg-surface-raised border border-border-default rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-400 mb-1">
                      <Package className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Unfulfilled</span>
                    </div>
                    <p className="text-xl font-bold text-text-primary">{stats.ordersByStatus.unfulfilled}</p>
                  </div>
                  
                  <div className="bg-surface-raised border border-border-default rounded-xl p-4">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                      <Truck className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Fulfilled</span>
                    </div>
                    <p className="text-xl font-bold text-text-primary">{stats.ordersByStatus.fulfilled}</p>
                  </div>
                  
                  <div className="bg-surface-raised border border-border-default rounded-xl p-4">
                    <div className="flex items-center gap-2 text-rose-400 mb-1">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Refunded</span>
                    </div>
                    <p className="text-xl font-bold text-text-primary">{stats.ordersByStatus.refunded}</p>
                  </div>
                </div>
              )}

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
                        className="px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                        {datePresets.map(preset => (
                          <option key={preset.value} value={preset.value}>{preset.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-text-secondary" />
                      <select
                        value={fulfillmentFilter}
                        onChange={(e) => setFulfillmentFilter(e.target.value)}
                        className="px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                        <option value="any">All Status</option>
                        <option value="unfulfilled">Unfulfilled</option>
                        <option value="partial">Partial</option>
                        <option value="fulfilled">Fulfilled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Orders Table */}
              {ordersLoading ? (
                <div className="bg-surface-raised border border-border-default rounded-xl p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-4 text-text-secondary">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="bg-surface-raised border border-border-default rounded-xl p-12 text-center space-y-4">
                  <div className="flex justify-center">
                    <IconBadge label="No orders" icon={ShoppingCart} size="lg" variant="neutral" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary">No orders found</h3>
                  <p className="text-text-secondary">
                    {searchTerm || fulfillmentFilter !== 'any' || datePreset !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Orders will appear here once customers place them'}
                  </p>
                </div>
              ) : (
                <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-full divide-y divide-border-default">
                      <thead className="bg-surface-elevated">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Order</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Customer</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Total</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Payment</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Fulfillment</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Date</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {filteredOrders.map((order) => (
                          <tr 
                            key={order.id} 
                            className="hover:bg-surface-hover transition-colors cursor-pointer"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <td className="px-6 py-4">
                              <div className="font-semibold text-text-primary">{order.name}</div>
                              <div className="text-sm text-text-muted">{order.lineItems.length} items</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-text-primary">{order.customer?.fullName || 'Guest'}</div>
                              <div className="text-sm text-text-muted">{order.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-text-primary">
                                {formatCurrency(order.totalPrice, order.currency)}
                              </span>
                            </td>
                            <td className="px-6 py-4">{getFinancialStatusBadge(order.financialStatus)}</td>
                            <td className="px-6 py-4">{getFulfillmentStatusBadge(order.fulfillmentStatus)}</td>
                            <td className="px-6 py-4 text-sm text-text-muted">{formatDate(order.createdAt)}</td>
                            <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
                              >
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
          )}
        </div>
      </div>

      {/* Order Details Slide-over */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedOrder(null)} />
          
          <div className="absolute inset-y-0 right-0 w-full max-w-xl flex">
            <div className="w-full bg-surface-raised border-l border-border-default flex flex-col overflow-hidden animate-slide-in-right">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border-default bg-surface-elevated">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{selectedOrder.name}</h2>
                  <p className="text-sm text-text-secondary">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status Badges */}
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

                {/* ZEN Fulfillment Section */}
                {selectedOrder.fulfillmentStatus !== 'fulfilled' && !processedZenOrders.has(selectedOrder.id) && (
                  <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-text-primary flex items-center gap-2">
                        <Zap className="w-4 h-4 text-violet-400" /> Fulfill via ZEN
                      </h3>
                      <span className="text-xs text-violet-400 bg-violet-500/20 px-2 py-1 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">
                      Let us handle fulfillment. Product cost will be deducted from your wallet.
                    </p>
                    
                    {/* Cost and Wallet Balance Display */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-surface-base rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-violet-400" />
                          <span className="text-sm text-text-secondary">Product Cost</span>
                        </div>
                        <span className="font-bold text-violet-400">
                          {formatCurrency(selectedOrder.subtotalPrice, selectedOrder.currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-surface-base rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-text-secondary">Wallet Balance</span>
                        </div>
                        <span className="font-bold text-emerald-400">
                          ₹{(walletBalance / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleFulfillViaZen(selectedOrder.id)}
                      disabled={zenLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-lg transition-all font-medium shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Zap className="w-4 h-4" />
                      {zenLoading ? 'Processing...' : `Fulfill via ZEN (${formatCurrency(selectedOrder.subtotalPrice, selectedOrder.currency)})`}
                    </button>
                  </div>
                )}

                {/* ZEN Processing Indicator - Show when order is being processed via ZEN */}
                {selectedOrder.fulfillmentStatus !== 'fulfilled' && processedZenOrders.has(selectedOrder.id) && (
                  <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-500/20 rounded-lg">
                        <Zap className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-violet-400">ZEN Fulfillment in Progress</h3>
                        <p className="text-sm text-text-secondary">
                          This order has been submitted for ZEN fulfillment. Our team will process it shortly.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-surface-elevated rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Package className="w-4 h-4" /> Quick Actions
                  </h3>
                  
                  {/* Mark as Paid Button - Show when payment is pending/not paid */}
                  {selectedOrder.financialStatus !== 'paid' && selectedOrder.financialStatus !== 'refunded' && (
                    <button
                      onClick={() => handleMarkCompleted(selectedOrder.id)}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg transition-all font-medium disabled:opacity-50 shadow-lg shadow-emerald-500/25"
                    >
                      <DollarSign className="w-4 h-4" />
                      {actionLoading ? 'Processing...' : 'Mark as Paid ₹' + parseFloat(selectedOrder.totalPrice).toLocaleString()}
                    </button>
                  )}

                  {/* Already Paid indicator */}
                  {selectedOrder.financialStatus === 'paid' && (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Payment Received</span>
                    </div>
                  )}
                  
                  {/* Mark as Fulfilled Button */}
                  {selectedOrder.fulfillmentStatus !== 'fulfilled' && (
                    <div className="space-y-2">
                      <textarea
                        value={fulfillNote}
                        onChange={(e) => setFulfillNote(e.target.value)}
                        placeholder="Add a fulfillment note (optional)..."
                        className="w-full px-3 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                        rows={2}
                      />
                      <button
                        onClick={() => handleFulfillOrder(selectedOrder.id)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                      >
                        <Truck className="w-4 h-4" />
                        {actionLoading ? 'Fulfilling...' : 'Self-Fulfill (Mark as Shipped)'}
                      </button>
                    </div>
                  )}

                  {/* Already Fulfilled indicator */}
                  {selectedOrder.fulfillmentStatus === 'fulfilled' && (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-lg">
                      <Truck className="w-4 h-4" />
                      <span className="font-medium">Order Fulfilled</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2 border-t border-border-default">
                    <button
                      onClick={() => handleOrderAction('close', selectedOrder.id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-surface-base hover:bg-surface-hover border border-border-default text-text-primary rounded-lg transition-colors text-sm disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Close Order
                    </button>
                    <button
                      onClick={() => setConfirmModal({ isOpen: true, action: 'cancel', orderId: selectedOrder.id })}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg transition-colors text-sm disabled:opacity-50"
                    >
                      <Ban className="w-4 h-4" />
                      Cancel Order
                    </button>
                  </div>
                </div>

                {/* Customer Info */}
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

                {/* Shipping Address */}
                {selectedOrder.shippingAddress && (
                  <div className="bg-surface-elevated rounded-xl p-4">
                    <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4" /> Shipping Address
                    </h3>
                    <p className="text-text-secondary">{selectedOrder.shippingAddress.formatted}</p>
                  </div>
                )}

                {/* Line Items */}
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
                        <p className="font-semibold text-text-primary">
                          {formatCurrency(item.price, selectedOrder.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
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

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This will notify the customer and cannot be undone."
        confirmText="Cancel Order"
        cancelText="Go Back"
        variant="danger"
        onConfirm={() => {
          if (confirmModal.orderId) handleOrderAction('cancel', confirmModal.orderId);
          setConfirmModal({ isOpen: false, action: '', orderId: null });
        }}
        onCancel={() => setConfirmModal({ isOpen: false, action: '', orderId: null })}
      />

      {/* Insufficient Balance Modal */}
      {showInsufficientModal && insufficientData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowInsufficientModal(false)} />
          <div className="relative bg-surface-raised border border-border-default rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in">
            <button
              onClick={() => setShowInsufficientModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/20 rounded-full mb-4">
                <AlertTriangle className="w-7 h-7 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Insufficient Balance</h2>
              <p className="text-text-secondary text-sm mt-1">
                You need more funds to fulfill this order
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center bg-surface-elevated rounded-lg p-3">
                <span className="text-text-secondary">Required Amount</span>
                <span className="font-bold text-text-primary">{insufficientData.requiredAmountFormatted}</span>
              </div>
              <div className="flex justify-between items-center bg-surface-elevated rounded-lg p-3">
                <span className="text-text-secondary">Current Balance</span>
                <span className="font-bold text-emerald-400">
                  ₹{(walletBalance / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <span className="text-amber-400">Amount Needed</span>
                <span className="font-bold text-amber-400">{insufficientData.shortageFormatted}</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-text-secondary text-center">Quick add to wallet:</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  Math.max(10000, Math.ceil(insufficientData.shortage / 100) * 100), // Minimum ₹100, round up shortage to nearest ₹1
                  50000, // ₹500
                  100000, // ₹1000
                ].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickTopup(amount)}
                    className="py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors text-sm font-medium"
                  >
                    ₹{(amount / 100).toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
              <Link
                href="/dashboard/wallet"
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                Go to Wallet
              </Link>
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
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
