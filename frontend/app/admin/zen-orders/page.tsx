'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import {
  Package,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  User,
  MapPin,
  Calendar,
  Hash,
  DollarSign,
  Eye,
  MoreVertical,
  ArrowRight,
} from 'lucide-react';

interface ZenOrder {
  id: string;
  orderId: string;
  shopifyOrderName: string;
  storeName: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  sku: string;
  itemCount: number;
  orderValue: number;
  orderValueFormatted: string;
  walletDeductedAmount: number;
  walletDeductedAmountFormatted: string;
  profit: number;
  profitFormatted: string;
  status: string;
  isPriority: boolean;
  isDelayed: boolean;
  hasIssue: boolean;
  trackingNumber: string | null;
  courierProvider: string | null;
  user: { name: string; email: string } | null;
  assignedPicker: { name: string; email: string } | null;
  assignedPacker: { name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  statusCounts: Record<string, number>;
  total: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active (Not Completed)' },
  { value: 'pending', label: 'Pending' },
  { value: 'sourcing', label: 'Sourcing' },
  { value: 'sourced', label: 'Sourced' },
  { value: 'packing', label: 'Packing' },
  { value: 'packed', label: 'Packed' },
  { value: 'ready_for_dispatch', label: 'Ready for Dispatch' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'rto_initiated', label: 'RTO Initiated' },
  { value: 'rto_delivered', label: 'RTO Delivered' },
  { value: 'returned', label: 'Returned' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  sourcing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  sourced: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  packing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  packed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ready_for_dispatch: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  dispatched: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  shipped: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  out_for_delivery: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rto_initiated: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  rto_delivered: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  returned: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  cancelled: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function ZenOrdersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<ZenOrder[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  // Filters
  const [statusFilter, setStatusFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [issuesOnly, setIssuesOnly] = useState(false);

  // Selected order for detail view
  const [selectedOrder, setSelectedOrder] = useState<ZenOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState<any>(null);

  // Status update
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Tracking update
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierProvider, setCourierProvider] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);

  // RTO Address
  const [rtoAddress, setRtoAddress] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  const [rtoAddressLoading, setRtoAddressLoading] = useState(false);

  // Location options (can be extended later)
  const COUNTRY_OPTIONS = useMemo(
    () => ['India'],
    []
  );

  const STATE_OPTIONS = useMemo(
    () =>
      ({
        India: [
          'Andhra Pradesh',
          'Assam',
          'Bihar',
          'Delhi',
          'Gujarat',
          'Haryana',
          'Karnataka',
          'Kerala',
          'Madhya Pradesh',
          'Maharashtra',
          'Punjab',
          'Rajasthan',
          'Tamil Nadu',
          'Telangana',
          'Uttar Pradesh',
          'West Bengal',
        ],
      } as Record<string, string[]>),
    []
  );

  const CITY_OPTIONS = useMemo(
    () =>
      ({
        Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru'],
        Maharashtra: ['Mumbai', 'Pune', 'Nagpur'],
        Delhi: ['New Delhi'],
        'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
        Telangana: ['Hyderabad'],
        'Uttar Pradesh': ['Lucknow', 'Noida', 'Ghaziabad'],
        Gujarat: ['Ahmedabad', 'Surat', 'Vadodara'],
        'West Bengal': ['Kolkata'],
      } as Record<string, string[]>),
    []
  );

  const availableStates = useMemo(() => {
    return STATE_OPTIONS[rtoAddress.country] || [];
  }, [STATE_OPTIONS, rtoAddress.country]);

  const availableCities = useMemo(() => {
    return CITY_OPTIONS[rtoAddress.state] || [];
  }, [CITY_OPTIONS, rtoAddress.state]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('limit', pageSize.toString());
      params.append('offset', (page * pageSize).toString());
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (priorityOnly) params.append('isPriority', 'true');
      if (issuesOnly) params.append('hasIssue', 'true');

      const response = await api.get<{
        success: boolean;
        data: ZenOrder[];
        pagination: { total: number };
        stats: Stats;
      }>(`/api/admin/zen-orders?${params.toString()}`);

      if (response.success) {
        setOrders(response.data);
        setTotal(response.pagination.total);
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to fetch ZEN orders:', error);
      notify.error('Failed to load ZEN orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchTerm, priorityOnly, issuesOnly]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchOrders();
    }
  }, [isAuthenticated, user, fetchOrders]);

  const fetchOrderDetail = async (zenOrderId: string) => {
    try {
      setDetailLoading(true);
      const response = await api.get<{ success: boolean; data: any }>(
        `/api/admin/zen-orders/${zenOrderId}`
      );
      if (response.success) {
        setOrderDetail(response.data);
        setTrackingNumber(response.data.trackingNumber || '');
        setCourierProvider(response.data.courierProvider || '');
        setRtoAddress(response.data.rtoAddress || {
          name: '',
          phone: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India',
        });
      }
    } catch (error) {
      console.error('Failed to fetch order detail:', error);
      notify.error('Failed to load order details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      setStatusUpdateLoading(true);
      const response = await api.post<{ success: boolean; message: string }>(
        `/api/admin/zen-orders/${selectedOrder.id}/status`,
        { status: newStatus, note: statusNote }
      );

      if (response.success) {
        notify.success(response.message);
        setNewStatus('');
        setStatusNote('');
        fetchOrders();
        fetchOrderDetail(selectedOrder.id);
      }
    } catch (error: any) {
      notify.error(error?.response?.data?.error || 'Failed to update status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleTrackingUpdate = async () => {
    if (!selectedOrder) return;

    try {
      setTrackingLoading(true);
      const response = await api.post<{ success: boolean; message: string }>(
        `/api/admin/zen-orders/${selectedOrder.id}/tracking`,
        { trackingNumber, courierProvider }
      );

      if (response.success) {
        notify.success('Tracking info updated');
        fetchOrders();
        fetchOrderDetail(selectedOrder.id);
      }
    } catch (error: any) {
      notify.error(error?.response?.data?.error || 'Failed to update tracking');
    } finally {
      setTrackingLoading(false);
    }
  };

  const handlePriorityToggle = async (orderId: string, currentPriority: boolean) => {
    try {
      const response = await api.post<{ success: boolean }>(
        `/api/admin/zen-orders/${orderId}/flags`,
        { isPriority: !currentPriority }
      );
      if (response.success) {
        notify.success(currentPriority ? 'Priority removed' : 'Marked as priority');
        fetchOrders();
      }
    } catch (error) {
      notify.error('Failed to update priority');
    }
  };

  const handleRtoAddressUpdate = async () => {
    if (!selectedOrder) return;
    try {
      setRtoAddressLoading(true);
      const response = await api.post<{ success: boolean; message: string }>(
        `/api/admin/zen-orders/${selectedOrder.id}/rto-address`,
        rtoAddress
      );

      if (response.success) {
        notify.success('RTO address updated');
        fetchOrderDetail(selectedOrder.id);
      }
    } catch (error: any) {
      notify.error(error?.response?.data?.error || 'Failed to update RTO address');
    } finally {
      setRtoAddressLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  if (authLoading || (isAuthenticated && user?.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" />
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
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <Package className="w-8 h-8 text-violet-400" />
              ZEN Orders
            </h1>
            <p className="mt-2 text-text-secondary">
              Manage fulfillment operations for all ZEN orders
            </p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              {Object.entries(stats.statusCounts).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setPage(0);
                  }}
                  className={`p-3 rounded-xl border transition-all ${
                    statusFilter === status
                      ? 'ring-2 ring-violet-500'
                      : 'hover:border-violet-500/50'
                  } ${STATUS_COLORS[status] || 'bg-surface-elevated border-border-default'}`}
                >
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs uppercase truncate">{status.replace(/_/g, ' ')}</p>
                </button>
              ))}
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
                    placeholder="Search orders, customers, tracking..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(0);
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  className="px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-violet-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 px-3 py-2 bg-surface-elevated border border-border-default rounded-lg cursor-pointer hover:border-amber-500/50">
                  <input
                    type="checkbox"
                    checked={priorityOnly}
                    onChange={(e) => {
                      setPriorityOnly(e.target.checked);
                      setPage(0);
                    }}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-text-primary">Priority</span>
                </label>
                <label className="flex items-center gap-2 px-3 py-2 bg-surface-elevated border border-border-default rounded-lg cursor-pointer hover:border-rose-500/50">
                  <input
                    type="checkbox"
                    checked={issuesOnly}
                    onChange={(e) => {
                      setIssuesOnly(e.target.checked);
                      setPage(0);
                    }}
                    className="w-4 h-4 text-rose-500 rounded"
                  />
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="text-sm text-text-primary">Issues</span>
                </label>
                <button
                  onClick={fetchOrders}
                  className="p-2 bg-surface-elevated border border-border-default rounded-lg hover:bg-surface-hover transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto" />
                <p className="mt-4 text-text-secondary">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary">No orders found</h3>
                <p className="text-text-secondary mt-1">
                  {searchTerm || statusFilter ? 'Try adjusting your filters' : 'ZEN orders will appear here'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-full divide-y divide-border-default">
                  <thead className="bg-surface-elevated">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Items</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Tracking</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {order.isPriority && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                            {order.hasIssue && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                            <div>
                              <p className="font-semibold text-text-primary">{order.shopifyOrderName}</p>
                              <p className="text-xs text-text-muted">{order.storeName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-text-primary">{order.customerName}</p>
                          <p className="text-xs text-text-muted truncate max-w-[150px]">{order.customerEmail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-text-primary">{order.itemCount} items</p>
                          <p className="text-xs text-text-muted truncate max-w-[100px]">{order.sku || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-text-primary">{order.orderValueFormatted}</p>
                          <p className="text-xs text-emerald-400">Profit: {order.profitFormatted}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status] || 'bg-surface-elevated text-text-secondary'}`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {order.trackingNumber ? (
                            <div>
                              <p className="text-xs text-text-primary font-mono">{order.trackingNumber}</p>
                              <p className="text-xs text-text-muted">{order.courierProvider}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted">Not assigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-text-secondary">{formatDate(order.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              fetchOrderDetail(order.id);
                            }}
                            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
                          >
                            <Eye className="w-5 h-5 text-text-secondary" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border-default flex items-center justify-between">
                <p className="text-sm text-text-muted">
                  Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-2 bg-surface-elevated border border-border-default rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 bg-surface-elevated border border-border-default rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
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
                  <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    {selectedOrder.shopifyOrderName}
                    {selectedOrder.isPriority && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
                  </h2>
                  <p className="text-sm text-text-secondary">{selectedOrder.storeName}</p>
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
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
                  </div>
                ) : (
                  <>
                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium border ${STATUS_COLORS[selectedOrder.status]}`}>
                        {selectedOrder.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <button
                        onClick={() => handlePriorityToggle(selectedOrder.id, selectedOrder.isPriority)}
                        className={`p-2 rounded-lg transition-colors ${
                          selectedOrder.isPriority
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-surface-elevated text-text-secondary hover:text-amber-400'
                        }`}
                        title={selectedOrder.isPriority ? 'Remove priority' : 'Mark as priority'}
                      >
                        <Star className={`w-5 h-5 ${selectedOrder.isPriority ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>

                    {/* Update Status */}
                    <div className="bg-surface-elevated rounded-xl p-4 space-y-3">
                      <h3 className="font-semibold text-text-primary flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" /> Update Status
                      </h3>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="">Select new status...</option>
                        {STATUS_OPTIONS.filter((s) => s.value && s.value !== 'active').map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Note (optional)"
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-violet-500"
                      />
                      <button
                        onClick={handleStatusUpdate}
                        disabled={!newStatus || statusUpdateLoading}
                        className="w-full py-2 bg-violet-500 hover:bg-violet-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {statusUpdateLoading ? 'Updating...' : 'Update Status'}
                      </button>
                    </div>

                    {/* Tracking Info */}
                    <div className="bg-surface-elevated rounded-xl p-4 space-y-3">
                      <h3 className="font-semibold text-text-primary flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Tracking Info
                      </h3>
                      <input
                        type="text"
                        placeholder="Tracking Number"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-violet-500 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Courier Provider (e.g., Delhivery, Shiprocket)"
                        value={courierProvider}
                        onChange={(e) => setCourierProvider(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-violet-500"
                      />
                      <button
                        onClick={handleTrackingUpdate}
                        disabled={trackingLoading}
                        className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {trackingLoading ? 'Updating...' : 'Update Tracking'}
                      </button>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-surface-elevated rounded-xl p-4 space-y-3">
                      <h3 className="font-semibold text-text-primary flex items-center gap-2">
                        <User className="w-4 h-4" /> Customer
                      </h3>
                      <p className="text-text-primary">{selectedOrder.customerName}</p>
                      <p className="text-text-secondary text-sm">{selectedOrder.customerEmail}</p>
                    </div>

                    {/* Shipping Address */}
                    {selectedOrder.shippingAddress && (
                      <div className="bg-surface-elevated rounded-xl p-4 space-y-3">
                        <h3 className="font-semibold text-text-primary flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> Shipping Address
                        </h3>
                        <p className="text-text-secondary text-sm">{selectedOrder.shippingAddress}</p>
                      </div>
                    )}

                    {/* RTO Address */}
                    <div className="bg-surface-elevated rounded-xl p-4 space-y-3">
                      <h3 className="font-semibold text-text-primary flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> RTO Address
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Name"
                          value={rtoAddress.name}
                          onChange={(e) => setRtoAddress({ ...rtoAddress, name: e.target.value })}
                          className="col-span-2 px-3 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-violet-500"
                        />
                        <input
                          type="text"
                          placeholder="Phone"
                          value={rtoAddress.phone}
                          onChange={(e) => setRtoAddress({ ...rtoAddress, phone: e.target.value })}
                          className="px-3 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-violet-500"
                        />
                        <input
                          type="text"
                          placeholder="Pincode"
                          value={rtoAddress.pincode}
                          onChange={(e) => setRtoAddress({ ...rtoAddress, pincode: e.target.value })}
                          className="px-3 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-violet-500"
                        />
                        <input
                          type="text"
                          placeholder="Address Line 1"
                          value={rtoAddress.addressLine1}
                          onChange={(e) => setRtoAddress({ ...rtoAddress, addressLine1: e.target.value })}
                          className="col-span-2 px-3 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-violet-500"
                        />
                        <input
                          type="text"
                          placeholder="Address Line 2"
                          value={rtoAddress.addressLine2}
                          onChange={(e) => setRtoAddress({ ...rtoAddress, addressLine2: e.target.value })}
                          className="col-span-2 px-3 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-violet-500"
                        />
                        {/* Country */}
                        <select
                          value={rtoAddress.country}
                          onChange={(e) => {
                            const newCountry = e.target.value;
                            setRtoAddress({
                              ...rtoAddress,
                              country: newCountry,
                              state: '',
                              city: '',
                            });
                          }}
                          className="col-span-2 px-3 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-violet-500"
                        >
                          <option value="">Select Country</option>
                          {COUNTRY_OPTIONS.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>

                        {/* State */}
                        <select
                          value={rtoAddress.state}
                          onChange={(e) => {
                            const newState = e.target.value;
                            setRtoAddress({
                              ...rtoAddress,
                              state: newState,
                              city: '',
                            });
                          }}
                          disabled={!rtoAddress.country}
                          className="px-3 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        >
                          <option value="">Select State</option>
                          {availableStates.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>

                        {/* City */}
                        <select
                          value={rtoAddress.city}
                          onChange={(e) => {
                            setRtoAddress({
                              ...rtoAddress,
                              city: e.target.value,
                            });
                          }}
                          disabled={!rtoAddress.state}
                          className="px-3 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                        >
                          <option value="">Select City</option>
                          {availableCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={handleRtoAddressUpdate}
                        disabled={rtoAddressLoading}
                        className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {rtoAddressLoading ? 'Updating...' : 'Update RTO Address'}
                      </button>
                    </div>

                    {/* Pricing */}
                    <div className="bg-surface-elevated rounded-xl p-4 space-y-2">
                      <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-3">
                        <DollarSign className="w-4 h-4" /> Pricing
                      </h3>
                      <div className="flex justify-between text-text-secondary">
                        <span>Order Value</span>
                        <span className="text-text-primary">{selectedOrder.orderValueFormatted}</span>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>Wallet Deducted</span>
                        <span className="text-text-primary">{selectedOrder.walletDeductedAmountFormatted}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-400 pt-2 border-t border-border-default">
                        <span>Profit</span>
                        <span>{selectedOrder.profitFormatted}</span>
                      </div>
                    </div>

                    {/* Status History */}
                    {orderDetail?.statusHistory && orderDetail.statusHistory.length > 0 && (
                      <div className="bg-surface-elevated rounded-xl p-4">
                        <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4" /> Status History
                        </h3>
                        <div className="space-y-3">
                          {orderDetail.statusHistory.slice().reverse().map((entry: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${STATUS_COLORS[entry.status]?.split(' ')[1] || 'bg-text-muted'}`} />
                              <div>
                                <p className="text-sm font-medium text-text-primary">
                                  {entry.status.replace(/_/g, ' ')}
                                </p>
                                <p className="text-xs text-text-muted">
                                  {formatDate(entry.changedAt)}
                                  {entry.note && ` - ${entry.note}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
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

