'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import LoadingScreen from '@/components/LoadingScreen';
import Button from '@/components/Button';
import { notify } from '@/lib/toast';
import { CheckCircle, XCircle, Clock, Eye, DollarSign, Filter, X } from 'lucide-react';

interface ServiceOrder {
  _id: string;
  userId: {
    _id: string;
    name?: string;
    email: string;
  };
  serviceType: 'ads_management' | 'connect_experts';
  planType: 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
  amount: number;
  commissionRate?: number;
  targetGoal?: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ServiceOrdersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [planTypeFilter, setPlanTypeFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [updating, setUpdating] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
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
      fetchOrders();
    }
  }, [isAuthenticated, user, serviceTypeFilter, statusFilter, paymentStatusFilter, planTypeFilter, pagination.page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (serviceTypeFilter) params.serviceType = serviceTypeFilter;
      if (statusFilter) params.status = statusFilter;
      if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
      if (planTypeFilter) params.planType = planTypeFilter;

      const response = await api.get<{ success: boolean; data: { orders: ServiceOrder[]; pagination: any } }>(
        `/api/services/orders/admin/all?${new URLSearchParams(params).toString()}`
      );

      if (response.success && response.data) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      }
    } catch (error: any) {
      notify.error('Failed to fetch service orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status?: string, paymentStatus?: string) => {
    try {
      setUpdating(true);
      const updateData: any = {};
      if (status) updateData.status = status;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;

      await api.put(`/api/services/orders/${orderId}/admin`, updateData);
      notify.success('Order updated successfully');
      fetchOrders();
      setSelectedOrder(null);
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (priceInPaise: number) => {
    return `₹${(priceInPaise / 100).toLocaleString('en-IN')}`;
  };

  const formatGoal = (goalInPaise: number) => {
    const lakhs = goalInPaise / 10000000;
    if (lakhs >= 100) {
      const crores = lakhs / 100;
      return `₹${crores.toFixed(1)} Cr`;
    }
    return `₹${lakhs.toFixed(0)}L`;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { icon: any; color: string; bg: string }> = {
      active: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
      expired: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
      cancelled: { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-500/20' },
      paid: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
      pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
      failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
      refunded: { icon: XCircle, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    };
    return badges[status] || badges.pending;
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Service Orders</h1>
          <p className="mt-2 text-text-secondary">Manage service orders and payments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-lg p-4 border border-border-default">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-text-secondary" />
          <h2 className="text-lg font-semibold text-text-primary">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Service Type</label>
            <select
              value={serviceTypeFilter}
              onChange={(e) => {
                setServiceTypeFilter(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary"
            >
              <option value="">All Services</option>
              <option value="ads_management">Ads Management</option>
              <option value="connect_experts">Connect with Experts</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Payment Status</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary"
            >
              <option value="">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Plan Type</label>
            <select
              value={planTypeFilter}
              onChange={(e) => {
                setPlanTypeFilter(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary"
            >
              <option value="">All Plans</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card rounded-lg border border-border-default overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-hover">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-text-secondary">
                    No service orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusBadge = getStatusBadge(order.status);
                  const paymentBadge = getStatusBadge(order.paymentStatus);
                  const StatusIcon = statusBadge.icon;
                  const PaymentIcon = paymentBadge.icon;

                  return (
                    <tr key={order._id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-primary">
                          {order._id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-primary">
                          {order.userId?.name || 'N/A'}
                        </div>
                        <div className="text-xs text-text-secondary">{order.userId?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-primary capitalize">
                          {order.serviceType.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-primary capitalize">{order.planType}</div>
                        {order.commissionRate && (
                          <div className="text-xs text-text-secondary">+{order.commissionRate}% commission</div>
                        )}
                        {order.targetGoal && (
                          <div className="text-xs text-text-secondary">Goal: {formatGoal(order.targetGoal)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-text-primary">
                          {formatPrice(order.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${paymentBadge.bg} ${paymentBadge.color}`}>
                          <PaymentIcon className="w-3 h-3" />
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-secondary">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-border-default flex items-center justify-between">
            <div className="text-sm text-text-secondary">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                variant="secondary"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                variant="secondary"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border-default">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-primary">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-secondary">Order ID</label>
                <div className="text-text-primary font-mono">{selectedOrder._id}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">User</label>
                <div className="text-text-primary">{selectedOrder.userId?.name || 'N/A'}</div>
                <div className="text-text-secondary text-sm">{selectedOrder.userId?.email}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Service Type</label>
                <div className="text-text-primary capitalize">{selectedOrder.serviceType.replace('_', ' ')}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Plan Type</label>
                <div className="text-text-primary capitalize">{selectedOrder.planType}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Amount</label>
                <div className="text-text-primary font-semibold text-lg">{formatPrice(selectedOrder.amount)}</div>
              </div>
              {selectedOrder.commissionRate && (
                <div>
                  <label className="text-sm font-medium text-text-secondary">Commission Rate</label>
                  <div className="text-text-primary">{selectedOrder.commissionRate}%</div>
                </div>
              )}
              {selectedOrder.targetGoal && (
                <div>
                  <label className="text-sm font-medium text-text-secondary">Target Goal</label>
                  <div className="text-text-primary font-semibold">{formatGoal(selectedOrder.targetGoal)}</div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-text-secondary">Payment Status</label>
                <div className="mt-1">
                  <select
                    value={selectedOrder.paymentStatus}
                    onChange={(e) => {
                      setSelectedOrder({ ...selectedOrder, paymentStatus: e.target.value as any });
                    }}
                    className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">Status</label>
                <div className="mt-1">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => {
                      setSelectedOrder({ ...selectedOrder, status: e.target.value as any });
                    }}
                    className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              {selectedOrder.razorpayOrderId && (
                <div>
                  <label className="text-sm font-medium text-text-secondary">Razorpay Order ID</label>
                  <div className="text-text-primary font-mono text-sm">{selectedOrder.razorpayOrderId}</div>
                </div>
              )}
              {selectedOrder.razorpayPaymentId && (
                <div>
                  <label className="text-sm font-medium text-text-secondary">Razorpay Payment ID</label>
                  <div className="text-text-primary font-mono text-sm">{selectedOrder.razorpayPaymentId}</div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-text-secondary">Start Date</label>
                <div className="text-text-primary">{new Date(selectedOrder.startDate).toLocaleString()}</div>
              </div>
              {selectedOrder.endDate && (
                <div>
                  <label className="text-sm font-medium text-text-secondary">End Date</label>
                  <div className="text-text-primary">{new Date(selectedOrder.endDate).toLocaleString()}</div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-4">
              <Button
                onClick={() => handleUpdateStatus(selectedOrder._id, selectedOrder.status, selectedOrder.paymentStatus)}
                loading={updating}
                className="flex-1"
              >
                Update Order
              </Button>
              <Button
                onClick={() => setSelectedOrder(null)}
                variant="secondary"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
