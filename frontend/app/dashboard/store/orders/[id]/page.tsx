'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { ArrowLeft, Loader2, Package, MapPin, User, CreditCard, MessageSquare, Plus } from 'lucide-react';
import Link from 'next/link';

export default function OrderDetailPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [store, setStore] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

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
        const [orderResponse, notesResponse] = await Promise.all([
          api.getStoreOrder(storeResponse.data._id, orderId),
          api.getOrderNotes(storeResponse.data._id, orderId),
        ]);
        if (orderResponse.success) {
          setOrder(orderResponse.data);
        }
        if (notesResponse.success) {
          setNotes(notesResponse.data || []);
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

  const handlePaymentStatusUpdate = async (status: string) => {
    if (!store || !order) return;

    try {
      setUpdating(true);
      const response = await api.updatePaymentStatus(store._id, order._id, status);
      if (response.success) {
        notify.success('Payment status updated');
        fetchData();
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to update payment status');
    } finally {
      setUpdating(false);
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

  const handleAddNote = async () => {
    if (!newNote.trim() || !store || !order) return;

    try {
      setAddingNote(true);
      const response = await api.addOrderNote(store._id, order._id, { text: newNote.trim() });
      if (response.success) {
        notify.success('Note added');
        setNewNote('');
        const notesResponse = await api.getOrderNotes(store._id, order._id);
        if (notesResponse.success) {
          setNotes(notesResponse.data || []);
        }
      }
    } catch (error: any) {
      notify.error('Failed to add note');
    } finally {
      setAddingNote(false);
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

        {/* Payment Status Update */}
        <div className="mb-6">
          <h3 className="font-semibold text-text-primary mb-3">Update Payment Status</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePaymentStatusUpdate('pending')}
              disabled={updating || order.paymentStatus === 'pending'}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Mark as Pending
            </button>
            <button
              onClick={() => handlePaymentStatusUpdate('paid')}
              disabled={updating || order.paymentStatus === 'paid'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Mark as Paid
            </button>
            <button
              onClick={() => handlePaymentStatusUpdate('failed')}
              disabled={updating || order.paymentStatus === 'failed'}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Mark as Failed
            </button>
            <button
              onClick={() => handlePaymentStatusUpdate('refunded')}
              disabled={updating || order.paymentStatus === 'refunded'}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Mark as Refunded
            </button>
          </div>
        </div>

        {/* Fulfillment Status Update */}
        <div className="mb-6">
          <h3 className="font-semibold text-text-primary mb-3">Update Fulfillment Status</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFulfillmentUpdate('pending')}
              disabled={updating || order.fulfillmentStatus === 'pending'}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Mark as Pending
            </button>
            <button
              onClick={() => handleFulfillmentUpdate('fulfilled')}
              disabled={updating || order.fulfillmentStatus === 'fulfilled'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Mark as Fulfilled
            </button>
            <button
              onClick={() => handleFulfillmentUpdate('shipped')}
              disabled={updating || order.fulfillmentStatus === 'shipped'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Mark as Shipped
            </button>
            <button
              onClick={() => handleFulfillmentUpdate('cancelled')}
              disabled={updating || order.fulfillmentStatus === 'cancelled'}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel Order
            </button>
          </div>
        </div>

        {/* Notes Section */}
        <div className="border-t border-border-default pt-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-text-primary">Order Notes</h3>
          </div>
          
          <div className="space-y-4 mb-4">
            {notes.map((note: any, index: number) => (
              <div key={index} className="bg-surface-base rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm text-text-primary">{note.text}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      {note.addedBy?.name || note.addedBy?.email || 'Unknown'} • {new Date(note.addedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-sm text-text-secondary">No notes yet</p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
              placeholder="Add a note..."
              className="flex-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary placeholder-text-secondary"
            />
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim() || addingNote}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
