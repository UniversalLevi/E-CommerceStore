'use client';

import { useEffect, useState } from 'react';
import { useStore } from '../layout';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { ShoppingCart, Loader2, Eye, Search, Download, CheckSquare, Square, Filter } from 'lucide-react';
import Link from 'next/link';

export default function StoreOrdersPage() {
  const { store } = useStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');
  const [applyingBulk, setApplyingBulk] = useState(false);

  useEffect(() => {
    if (store) {
      fetchData();
    }
  }, [store, paymentFilter, fulfillmentFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (store) {
        let ordersResponse;
        if (searchQuery.trim()) {
          ordersResponse = await api.searchStoreOrders(store._id, searchQuery.trim());
        } else {
          ordersResponse = await api.getStoreOrders(store._id, {
            paymentStatus: paymentFilter === 'all' ? undefined : paymentFilter,
            fulfillmentStatus: fulfillmentFilter === 'all' ? undefined : fulfillmentFilter,
          });
        }
        if (ordersResponse.success) {
          setOrders(ordersResponse.data.orders || []);
        }
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData();
  };

  const handleExport = async () => {
    try {
      await api.exportStoreOrders(store._id, {
        format: 'csv',
        paymentStatus: paymentFilter === 'all' ? undefined : paymentFilter,
        fulfillmentStatus: fulfillmentFilter === 'all' ? undefined : fulfillmentFilter,
      });
      notify.success('Orders exported successfully');
    } catch (error: any) {
      notify.error('Failed to export orders');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrders.size === 0) {
      notify.error('Please select orders and an action');
      return;
    }

    try {
      setApplyingBulk(true);
      const response = await api.bulkUpdateStoreOrders(store._id, {
        orderIds: Array.from(selectedOrders),
        fulfillmentStatus: bulkAction,
      });
      if (response.success) {
        notify.success(`Updated ${response.data.updated} orders`);
        setSelectedOrders(new Set());
        setBulkAction('');
        fetchData();
      }
    } catch (error: any) {
      notify.error('Failed to update orders');
    } finally {
      setApplyingBulk(false);
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map((o) => o._id)));
    }
  };

  const formatPrice = (price: number) => {
    const currencySymbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    const symbol = currencySymbols[store?.currency || 'INR'] || store?.currency || 'INR';
    return `${symbol}${(price / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!store) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Orders</h1>
          <p className="text-sm text-text-secondary mt-1">Manage and track customer orders</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25 font-medium text-sm"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface-raised rounded-xl border border-border-default p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-base border border-border-default rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Payment</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Fulfillment</label>
              <select
                value={fulfillmentFilter}
                onChange={(e) => setFulfillmentFilter(e.target.value)}
                className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="shipped">Shipped</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {selectedOrders.size > 0 && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <span className="text-sm font-medium text-text-primary">
            {selectedOrders.size} order{selectedOrders.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select action...</option>
              <option value="fulfilled">Mark as Fulfilled</option>
              <option value="shipped">Mark as Shipped</option>
              <option value="cancelled">Mark as Cancelled</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || applyingBulk}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-lg shadow-purple-500/25"
            >
              {applyingBulk ? 'Applying...' : 'Apply'}
            </button>
            <button
              onClick={() => setSelectedOrders(new Set())}
              className="px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary hover:bg-surface-hover transition-colors text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-surface-raised rounded-xl border border-border-default p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No orders yet</h3>
          <p className="text-text-secondary">Orders will appear here when customers make purchases</p>
        </div>
      ) : (
        <div className="bg-surface-raised rounded-xl border border-border-default overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-surface-base to-surface-raised border-b border-border-default">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button onClick={toggleSelectAll} className="text-text-secondary hover:text-purple-400 transition-colors">
                      {selectedOrders.size === orders.length ? (
                        <CheckSquare className="h-5 w-5" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Fulfillment</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSelectOrder(order._id)}
                        className="text-text-secondary hover:text-purple-400 transition-colors"
                      >
                        {selectedOrders.has(order._id) ? (
                          <CheckSquare className="h-5 w-5" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-text-primary font-mono">{order.orderId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-primary">{order.customer.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-text-primary">{formatPrice(order.total)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.paymentStatus === 'paid'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : order.paymentStatus === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          order.fulfillmentStatus === 'fulfilled'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : order.fulfillmentStatus === 'shipped'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}
                      >
                        {order.fulfillmentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-secondary">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/store/orders/${order._id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-500 hover:text-purple-400 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
