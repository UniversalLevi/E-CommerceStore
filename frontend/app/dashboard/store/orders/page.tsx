'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { ShoppingCart, Loader2, Eye } from 'lucide-react';
import Link from 'next/link';

export default function StoreOrdersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchData();
    }
  }, [authLoading, isAuthenticated, router, paymentFilter, fulfillmentFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const storeResponse = await api.getMyStore();
      if (storeResponse.success && storeResponse.data) {
        setStore(storeResponse.data);
        const ordersResponse = await api.getStoreOrders(storeResponse.data._id, {
          paymentStatus: paymentFilter === 'all' ? undefined : paymentFilter,
          fulfillmentStatus: fulfillmentFilter === 'all' ? undefined : fulfillmentFilter,
        });
        if (ordersResponse.success) {
          setOrders(ordersResponse.data.orders || []);
        }
      } else {
        router.push('/dashboard/store');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

  if (authLoading || loading) {
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
      <h1 className="text-2xl font-bold text-text-primary">Orders</h1>

      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Payment Status</label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Fulfillment Status</label>
          <select
            value={fulfillmentFilter}
            onChange={(e) => setFulfillmentFilter(e.target.value)}
            className="px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="shipped">Shipped</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-surface-raised rounded-lg border border-border-default p-12 text-center">
          <ShoppingCart className="h-12 w-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No orders yet</h3>
          <p className="text-text-secondary">Orders will appear here when customers make purchases</p>
        </div>
      ) : (
        <div className="bg-surface-raised rounded-lg border border-border-default overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-base border-b border-border-default">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Fulfillment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-surface-hover">
                  <td className="px-6 py-4 text-sm font-medium text-text-primary">{order.orderId}</td>
                  <td className="px-6 py-4 text-sm text-text-primary">{order.customer.name}</td>
                  <td className="px-6 py-4 text-sm text-text-primary">{formatPrice(order.total)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        order.paymentStatus === 'paid'
                          ? 'bg-green-500/20 text-green-400'
                          : order.paymentStatus === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        order.fulfillmentStatus === 'fulfilled'
                          ? 'bg-green-500/20 text-green-400'
                          : order.fulfillmentStatus === 'shipped'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {order.fulfillmentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/store/orders/${order._id}`}
                      className="inline-flex items-center gap-1 text-sm text-purple-500 hover:text-purple-400"
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
      )}
    </div>
  );
}
