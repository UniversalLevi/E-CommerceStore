'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionLock from '@/components/SubscriptionLock';
import {
  FileText,
  Plus,
  Pencil,
  Eye,
  RefreshCw,
  Filter,
  X,
  Loader2,
  ShoppingCart,
} from 'lucide-react';

interface ManualOrder {
  _id: string;
  orderId: string;
  customer: { name: string; email: string; phone: string };
  shippingAddress: { name: string; address1: string; address2?: string; city: string; state: string; zip: string; country: string; phone: string };
  items: { productId: string; title: string; quantity: number; price: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface UserProduct {
  _id: string;
  title: string;
  price: number;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'cancelled', label: 'Cancelled' },
];

function formatCurrency(paise: number, currency = 'INR') {
  const symbol = currency === 'INR' ? '₹' : currency;
  return `${currency === 'INR' ? '₹' : ''}${(paise / 100).toFixed(2)}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

export default function ManualOrdersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { hasActiveSubscription } = useSubscription();
  const [orders, setOrders] = useState<ManualOrder[]>([]);
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customer: { name: '', email: '', phone: '' },
    shippingAddress: { name: '', address1: '', address2: '', city: '', state: '', zip: '', country: 'India', phone: '' },
    items: [] as { productId: string; title: string; quantity: number; price: number }[],
    shipping: 0,
    currency: 'INR',
    status: 'pending',
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getManualOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (res.success && res.data) {
        setOrders(res.data);
        if (res.pagination) setPagination((p) => ({ ...p, ...res.pagination }));
      }
    } catch (e: any) {
      notify.error(e?.response?.data?.message || 'Failed to load manual orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.page, pagination.limit]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: UserProduct[] }>('/api/products/user');
      if (res.success && Array.isArray(res.data)) setProducts(res.data);
      else setProducts([]);
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!authLoading && isAuthenticated && hasActiveSubscription) {
      fetchProducts();
    }
  }, [authLoading, isAuthenticated, hasActiveSubscription, router, fetchProducts]);

  useEffect(() => {
    if (isAuthenticated && hasActiveSubscription) fetchOrders();
  }, [isAuthenticated, hasActiveSubscription, statusFilter, pagination.page, fetchOrders]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      customer: { name: '', email: '', phone: '' },
      shippingAddress: { name: '', address1: '', address2: '', city: '', state: '', zip: '', country: 'India', phone: '' },
      items: [],
      shipping: 0,
      currency: 'INR',
      status: 'pending',
    });
    setModalOpen(true);
  };

  const openEdit = (order: ManualOrder) => {
    setEditingId(order._id);
    setForm({
      customer: { ...order.customer },
      shippingAddress: { ...order.shippingAddress, address2: order.shippingAddress?.address2 || '' },
      items: order.items.map((i) => ({ ...i, productId: typeof i.productId === 'object' ? (i.productId as any)._id : i.productId })),
      shipping: order.shipping || 0,
      currency: order.currency || 'INR',
      status: order.status,
    });
    setModalOpen(true);
  };

  const openDetail = (order: ManualOrder) => {
    setDetailId(order._id);
  };

  const addLineItem = () => {
    const first = products[0];
    if (!first) {
      notify.error('Add products to your account first');
      return;
    }
    setForm((f) => ({
      ...f,
      items: [...f.items, { productId: first._id, title: first.title, quantity: 1, price: Math.round(first.price * 100) }],
    }));
  };

  const updateLineItem = (index: number, field: 'productId' | 'quantity' | 'price', value: string | number) => {
    setForm((f) => {
      const next = [...f.items];
      const item = { ...next[index] };
      if (field === 'productId') {
        const product = products.find((p) => p._id === value);
        if (product) {
          item.productId = product._id;
          item.title = product.title;
          item.price = Math.round(product.price * 100);
        }
      } else if (field === 'quantity') item.quantity = Math.max(1, parseInt(String(value), 10) || 1);
      else if (field === 'price') item.price = Math.max(0, Math.round(Number(value)));
      next[index] = item;
      return { ...f, items: next };
    });
  };

  const removeLineItem = (index: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const subtotal = form.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + (form.shipping || 0);

  const saveOrder = async () => {
    if (!form.customer.name?.trim() || !form.customer.email?.trim() || !form.customer.phone?.trim()) {
      notify.error('Customer name, email and phone are required');
      return;
    }
    if (!form.shippingAddress.name?.trim() || !form.shippingAddress.address1?.trim() || !form.shippingAddress.city?.trim() ||
        !form.shippingAddress.state?.trim() || !form.shippingAddress.zip?.trim() || !form.shippingAddress.country?.trim() || !form.shippingAddress.phone?.trim()) {
      notify.error('Complete shipping address is required');
      return;
    }
    if (form.items.length === 0) {
      notify.error('Add at least one item');
      return;
    }
    setSaving(true);
    try {
      const body = {
        customer: form.customer,
        shippingAddress: form.shippingAddress,
        items: form.items,
        shipping: form.shipping,
        currency: form.currency,
        status: form.status,
      };
      if (editingId) {
        await api.updateManualOrder(editingId, body);
        notify.success('Order updated');
      } else {
        await api.createManualOrder(body);
        notify.success('Order created');
      }
      setModalOpen(false);
      fetchOrders();
    } catch (e: any) {
      notify.error(e?.response?.data?.message || 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.updateManualOrderStatus(orderId, status);
      notify.success('Status updated');
      fetchOrders();
      setDetailId(null);
    } catch (e: any) {
      notify.error(e?.response?.data?.message || 'Failed to update status');
    }
  };

  if (!authLoading && isAuthenticated && !hasActiveSubscription) {
    return <SubscriptionLock featureName="Manual Orders" />;
  }

  const selectedOrder = detailId ? orders.find((o) => o._id === detailId) : null;

  return (
    <div className="min-h-screen bg-surface-base p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Manual Orders</h1>
            <p className="text-sm text-text-secondary mt-1">Manage orders you sell outside the platform (e.g. WhatsApp, offline)</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="p-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-hover"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium text-sm"
            >
              <Plus className="h-4 w-4" />
              New Order
            </button>
          </div>
        </div>

        <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No manual orders yet.</p>
              <p className="text-sm mt-1">Create an order to track sales from outside the platform.</p>
              <button onClick={openCreate} className="mt-4 text-purple-400 hover:text-purple-300 font-medium">
                Create your first order
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-default">
                <thead className="bg-surface-base">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-surface-hover">
                      <td className="px-4 py-3 text-sm font-mono text-text-primary">{order.orderId}</td>
                      <td className="px-4 py-3 text-sm text-text-primary">{order.customer?.name || order.customer?.email || '—'}</td>
                      <td className="px-4 py-3 text-sm text-text-primary">{formatCurrency(order.total, order.currency)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          order.status === 'fulfilled' ? 'bg-green-500/20 text-green-400' :
                          order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                          order.status === 'paid' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-surface-base text-text-secondary'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openDetail(order)} className="p-1.5 text-text-secondary hover:text-text-primary mr-1" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(order)} className="p-1.5 text-text-secondary hover:text-text-primary" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="mt-4 flex justify-between items-center text-sm text-text-secondary">
            <span>Page {pagination.page} of {pagination.pages} ({pagination.total} total)</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 rounded border border-border-default disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 rounded border border-border-default disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border-default flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">{editingId ? 'Edit Order' : 'New Manual Order'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 text-text-secondary hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Customer</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    placeholder="Name"
                    value={form.customer.name}
                    onChange={(e) => setForm((f) => ({ ...f, customer: { ...f.customer, name: e.target.value } }))}
                    className="px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm"
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    value={form.customer.email}
                    onChange={(e) => setForm((f) => ({ ...f, customer: { ...f.customer, email: e.target.value } }))}
                    className="px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm"
                  />
                  <input
                    placeholder="Phone"
                    value={form.customer.phone}
                    onChange={(e) => setForm((f) => ({ ...f, customer: { ...f.customer, phone: e.target.value } }))}
                    className="px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Shipping Address</label>
                <div className="space-y-2">
                  <input
                    placeholder="Name"
                    value={form.shippingAddress.name}
                    onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, name: e.target.value } }))}
                    className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm"
                  />
                  <input
                    placeholder="Address line 1"
                    value={form.shippingAddress.address1}
                    onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, address1: e.target.value } }))}
                    className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm"
                  />
                  <input
                    placeholder="Address line 2 (optional)"
                    value={form.shippingAddress.address2}
                    onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, address2: e.target.value } }))}
                    className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input placeholder="City" value={form.shippingAddress.city} onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, city: e.target.value } }))} className="px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm" />
                    <input placeholder="State" value={form.shippingAddress.state} onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, state: e.target.value } }))} className="px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm" />
                    <input placeholder="ZIP" value={form.shippingAddress.zip} onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, zip: e.target.value } }))} className="px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm" />
                    <input placeholder="Country" value={form.shippingAddress.country} onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, country: e.target.value } }))} className="px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm" />
                  </div>
                  <input
                    placeholder="Phone"
                    value={form.shippingAddress.phone}
                    onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, phone: e.target.value } }))}
                    className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-text-secondary">Items (price in paise)</label>
                  <button type="button" onClick={addLineItem} className="text-sm text-purple-400 hover:text-purple-300">
                    + Add item
                  </button>
                </div>
                {form.items.length === 0 ? (
                  <p className="text-sm text-text-secondary py-2">No items. Add products from your catalog.</p>
                ) : (
                  <div className="space-y-2">
                    {form.items.map((item, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2 p-2 bg-surface-base rounded-lg">
                        <select
                          value={item.productId}
                          onChange={(e) => updateLineItem(i, 'productId', e.target.value)}
                          className="flex-1 min-w-[120px] px-2 py-1.5 bg-surface-raised border border-border-default rounded text-text-primary text-sm"
                        >
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>{p.title}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateLineItem(i, 'quantity', e.target.value)}
                          className="w-16 px-2 py-1.5 bg-surface-raised border border-border-default rounded text-text-primary text-sm"
                        />
                        <input
                          type="number"
                          min={0}
                          placeholder="Price (paise)"
                          value={item.price}
                          onChange={(e) => updateLineItem(i, 'price', e.target.value)}
                          className="w-24 px-2 py-1.5 bg-surface-raised border border-border-default rounded text-text-primary text-sm"
                        />
                        <button type="button" onClick={() => removeLineItem(i)} className="p-1 text-red-400 hover:text-red-300">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-text-secondary">Subtotal: {formatCurrency(subtotal)}</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Shipping (paise)"
                    value={form.shipping || ''}
                    onChange={(e) => setForm((f) => ({ ...f, shipping: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                    className="w-28 px-2 py-1 border border-border-default rounded text-text-primary bg-surface-base"
                  />
                  <span className="font-medium text-text-primary">Total: {formatCurrency(total)}</span>
                </div>
              </div>
              {editingId && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm"
                  >
                    {STATUS_OPTIONS.filter((o) => o.value !== 'all').map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-border-default flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-border-default text-text-primary hover:bg-surface-hover">
                Cancel
              </button>
              <button onClick={saveOrder} disabled={saving} className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 inline-flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail / quick status modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDetailId(null)}>
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">{selectedOrder.orderId}</h2>
              <button onClick={() => setDetailId(null)} className="p-2 text-text-secondary hover:text-text-primary"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-text-secondary"><span className="text-text-primary">Customer:</span> {selectedOrder.customer?.name} – {selectedOrder.customer?.email}</p>
            <p className="text-sm text-text-secondary mt-1"><span className="text-text-primary">Address:</span> {selectedOrder.shippingAddress?.address1}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zip}</p>
            <p className="text-sm text-text-secondary mt-1"><span className="text-text-primary">Items:</span> {selectedOrder.items?.length || 0} – Total {formatCurrency(selectedOrder.total, selectedOrder.currency)}</p>
            <p className="text-sm text-text-secondary mt-1"><span className="text-text-primary">Status:</span> {selectedOrder.status}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(['pending', 'paid', 'fulfilled', 'cancelled'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(selectedOrder._id, s)}
                  disabled={selectedOrder.status === s}
                  className="px-3 py-1.5 rounded-lg border border-border-default text-sm disabled:opacity-50 hover:bg-surface-hover"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
