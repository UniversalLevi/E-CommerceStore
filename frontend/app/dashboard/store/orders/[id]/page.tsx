'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { ArrowLeft, Loader2, Package, MapPin, User, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function OrderDetailPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [store, setStore] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchData();
    }
  }, [authLoading, isAuthenticated, router, orderId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const storeResponse = await api.getMyStore();
      if (storeResponse.success && storeResponse.data) {
        setStore(storeResponse.data);
        const orderResponse = await api.getStoreOrder(storeResponse.data._id, orderId);
        if (orderResponse.success) {
          setOrder(orderResponse.data);
        }
      } else {
        router.push('/dashboard/store');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      notify.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleFulfillmentUpdate = async (status: string) => {
    if (!store || !order) return;

    try {
      setUpdating(true);
      const response = await api.updateFulfillmentStatus(store._id, order._id, status);
      if (response.success) {
        notify.success('Fulfillment status updated');
        fetchData();
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to update fulfillment status');
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!store || !order) {
    return null;
  }

  const formatPrice = (price: number) => {
    const currencySymbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    const symbol = currencySymbols[store.currency] || store.currency;
    return `${symbol}${(price / 100).toFixed(2)}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/dashboard/store/orders"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <div className="bg-surface-raised rounded-lg border border-border-default p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Order {order.orderId}</h1>
            <p className="text-text-secondary mt-1">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                order.paymentStatus === 'paid'
                  ? 'bg-green-500/20 text-green-400'
                  : order.paymentStatus === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              Payment: {order.paymentStatus}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                order.fulfillmentStatus === 'fulfilled'
                  ? 'bg-green-500/20 text-green-400'
                  : order.fulfillmentStatus === 'shipped'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              Fulfillment: {order.fulfillmentStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-surface-base rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold text-text-primary">Customer Information</h3>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-text-primary">{order.customer.name}</p>
              <p className="text-text-secondary">{order.customer.email}</p>
              <p className="text-text-secondary">{order.customer.phone}</p>
            </div>
          </div>

          <div className="bg-surface-base rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-text-primary">Shipping Address</h3>
            </div>
            <div className="space-y-1 text-sm text-text-secondary">
              <p>{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.address1}</p>
              {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
              </p>
              <p>{order.shippingAddress.country}</p>
              <p>{order.shippingAddress.phone}</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-5 w-5 text-indigo-500" />
            <h3 className="font-semibold text-text-primary">Order Items</h3>
          </div>
          <div className="bg-surface-base rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-raised border-b border-border-default">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Product</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Variant</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">Quantity</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {order.items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-text-primary">{item.title}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{item.variant || '-'}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-text-primary text-right">{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface-base rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-text-primary">Order Summary</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <span className="text-text-primary">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Shipping</span>
              <span className="text-text-primary">{formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border-default">
              <span className="text-text-primary">Total</span>
              <span className="text-text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {order.paymentStatus === 'paid' && (
          <div>
            <h3 className="font-semibold text-text-primary mb-3">Update Fulfillment Status</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleFulfillmentUpdate('fulfilled')}
                disabled={updating || order.fulfillmentStatus === 'fulfilled'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark as Fulfilled
              </button>
              <button
                onClick={() => handleFulfillmentUpdate('shipped')}
                disabled={updating || order.fulfillmentStatus === 'shipped'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark as Shipped
              </button>
              <button
                onClick={() => handleFulfillmentUpdate('cancelled')}
                disabled={updating || order.fulfillmentStatus === 'cancelled'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
