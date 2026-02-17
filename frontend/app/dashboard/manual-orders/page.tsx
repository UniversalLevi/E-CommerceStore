'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
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

interface NicheRef {
  _id: string;
  name: string;
  slug: string;
}

interface UserProduct {
  _id: string;
  title: string;
  price: number;
  niche?: NicheRef;
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
    items: [] as { productId: string; title: string; quantity: number; price: number; selectedNicheId?: string }[],
    shipping: 0,
    currency: 'INR',
    status: 'pending',
  });

  const nichesFromProducts = useMemo(() => {
    const seen = new Set<string>();
    const list: NicheRef[] = [];
    for (const p of products) {
      const n = p.niche;
      if (n && n._id && !seen.has(n._id)) {
        seen.add(n._id);
        list.push({ _id: n._id, name: n.name, slug: n.slug });
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);
  // Form stores price in rupees; we convert to paise when sending to API

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
      const res = await api.get<{ success: boolean; data: UserProduct[] }>('/api/manual-orders/available-products');
      if (res?.success && Array.isArray(res.data)) setProducts(res.data);
      else setProducts([]);
    } catch {
      setProducts([]);
      notify.error('Could not load products; you can still add manual items.');
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!authLoading && isAuthenticated) {
      fetchProducts();
    }
  }, [authLoading, isAuthenticated, router, fetchProducts]);

  useEffect(() => {
    if (isAuthenticated) fetchOrders();
  }, [isAuthenticated, statusFilter, pagination.page, fetchOrders]);

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
    fetchProducts();
    setModalOpen(true);
  };

  const openEdit = (order: ManualOrder) => {
    setEditingId(order._id);
    const productIdStr = (id: any) => (typeof id === 'object' ? (id as any)?._id : id) || '';
    setForm({
      customer: { ...order.customer },
      shippingAddress: { ...order.shippingAddress, address2: order.shippingAddress?.address2 || '' },
      items: order.items.map((i) => {
        const pid = productIdStr(i.productId);
        const product = products.find((p) => p._id === pid);
        return {
          productId: pid,
          title: i.title,
          quantity: i.quantity,
          price: (i.price || 0) / 100,
          selectedNicheId: product?.niche?._id ?? '',
        };
      }),
      shipping: (order.shipping || 0) / 100,
      currency: order.currency || 'INR',
      status: order.status,
    });
    fetchProducts();
    setModalOpen(true);
  };

  const openDetail = (order: ManualOrder) => {
    setDetailId(order._id);
  };

  const addLineItem = () => {
    setForm((f) => ({
      ...f,
      items: [...f.items, { productId: '', title: '', quantity: 1, price: 0, selectedNicheId: '' }],
    }));
  };

  const updateLineItem = (index: number, field: 'productId' | 'title' | 'quantity' | 'price' | 'selectedNicheId', value: string | number) => {
    setForm((f) => {
      const next = [...f.items];
      const item = { ...next[index] };
      if (field === 'selectedNicheId') {
        item.selectedNicheId = typeof value === 'string' ? value : '';
        item.productId = '';
        item.title = '';
        item.price = 0;
      } else if (field === 'productId') {
        const product = products.find((p) => p._id === value);
        if (product) {
          item.productId = product._id;
          item.title = product.title;
          item.price = product.price;
        } else {
          item.productId = typeof value === 'string' ? value : '';
        }
      } else if (field === 'title') item.title = String(value);
      else if (field === 'quantity') item.quantity = Math.max(1, parseInt(String(value), 10) || 1);
      else if (field === 'price') item.price = Math.max(0, Number(value));
      next[index] = item;
      return { ...f, items: next };
    });
  };

  const removeLineItem = (index: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const subtotalRupees = form.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalRupees = subtotalRupees + (form.shipping || 0);

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
    const missingTitle = form.items.some((i) => !i.title?.trim());
    if (missingTitle) {
      notify.error('Every item must have a name');
      return;
    }
    setSaving(true);
    try {
      const body = {
        customer: form.customer,
        shippingAddress: form.shippingAddress,
        items: form.items.map((i) => ({
          productId: i.productId || undefined,
          title: i.title,
          quantity: i.quantity,
          price: Math.round(i.price * 100),
        })),
        shipping: Math.round((form.shipping || 0) * 100),
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

      {/* Create/Edit Modal – redesigned */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-border-default flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">{editingId ? 'Edit Order' : 'New Manual Order'}</h2>
                <p className="text-sm text-text-secondary mt-0.5">{editingId ? 'Update customer, address and items' : 'Add customer details, shipping address and order items'}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-text-primary">Customer</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    placeholder="Name"
                    value={form.customer.name}
                    onChange={(e) => setForm((f) => ({ ...f, customer: { ...f.customer, name: e.target.value } }))}
                    className="px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    value={form.customer.email}
                    onChange={(e) => setForm((f) => ({ ...f, customer: { ...f.customer, email: e.target.value } }))}
                    className="px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                  <input
                    placeholder="Phone"
                    value={form.customer.phone}
                    onChange={(e) => setForm((f) => ({ ...f, customer: { ...f.customer, phone: e.target.value } }))}
                    className="px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-medium text-text-primary">Shipping address</h3>
                <div className="p-4 bg-surface-base rounded-lg border border-border-default space-y-3">
                  <input
                    placeholder="Full name"
                    value={form.shippingAddress.name}
                    onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, name: e.target.value } }))}
                    className="w-full px-3 py-2.5 bg-surface-raised border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                  <input
                    placeholder="Address line 1"
                    value={form.shippingAddress.address1}
                    onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, address1: e.target.value } }))}
                    className="w-full px-3 py-2.5 bg-surface-raised border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                  <input
                    placeholder="Address line 2 (optional)"
                    value={form.shippingAddress.address2}
                    onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, address2: e.target.value } }))}
                    className="w-full px-3 py-2.5 bg-surface-raised border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <input placeholder="City" value={form.shippingAddress.city} onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, city: e.target.value } }))} className="px-3 py-2.5 bg-surface-raised border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                    <input placeholder="State" value={form.shippingAddress.state} onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, state: e.target.value } }))} className="px-3 py-2.5 bg-surface-raised border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                    <input placeholder="ZIP" value={form.shippingAddress.zip} onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, zip: e.target.value } }))} className="px-3 py-2.5 bg-surface-raised border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                    <input placeholder="Country" value={form.shippingAddress.country} onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, country: e.target.value } }))} className="px-3 py-2.5 bg-surface-raised border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                  </div>
                  <input
                    placeholder="Phone"
                    value={form.shippingAddress.phone}
                    onChange={(e) => setForm((f) => ({ ...f, shippingAddress: { ...f.shippingAddress, phone: e.target.value } }))}
                    className="w-full px-3 py-2.5 bg-surface-raised border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-text-primary">Order items (prices in ₹)</h3>
                  <button type="button" onClick={addLineItem} className="text-sm font-medium text-purple-400 hover:text-purple-300">
                    + Add item
                  </button>
                </div>
                {products.length === 0 && (
                  <p className="text-sm text-text-secondary py-1">Add products to your store in the Products section to select them here, or use Manual product below.</p>
                )}
                {form.items.length === 0 ? (
                  <p className="text-sm text-text-secondary py-3">No items yet. Click &quot;+ Add item&quot; to add a line. Choose a product from the dropdown or &quot;Manual product&quot; and enter name and price.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2 px-2 py-1.5 text-xs font-medium text-text-secondary">
                      {nichesFromProducts.length > 0 && <span className="w-36 min-w-[8rem]">Niche</span>}
                      <span className="w-44 min-w-[10rem]">Product</span>
                      <span className="flex-1 min-w-[120px]">Item name</span>
                      <span className="w-14">Qty</span>
                      <span className="w-20">Price (₹)</span>
                      <span className="w-8" aria-hidden />
                    </div>
                    {form.items.map((item, i) => {
                      const selectedNicheId = item.selectedNicheId ?? '';
                      const productsForRow = selectedNicheId ? products.filter((p) => p.niche?._id === selectedNicheId) : products;
                      return (
                        <div key={i} className="flex flex-wrap items-center gap-2 p-3 bg-surface-base rounded-lg border border-border-default">
                          {nichesFromProducts.length > 0 && (
                            <select
                              value={selectedNicheId}
                              onChange={(e) => updateLineItem(i, 'selectedNicheId', e.target.value)}
                              className="w-36 min-w-[8rem] px-2.5 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                              aria-label="Niche"
                            >
                              <option value="">All niches</option>
                              {nichesFromProducts.map((n) => (
                                <option key={n._id} value={n._id}>{n.name}</option>
                              ))}
                            </select>
                          )}
                          <select
                            value={item.productId}
                            onChange={(e) => updateLineItem(i, 'productId', e.target.value)}
                            className="w-44 min-w-[10rem] px-2.5 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                            aria-label="Product"
                          >
                            <option value="">Manual product</option>
                            {productsForRow.map((p) => (
                              <option key={p._id} value={p._id}>{p.title} — ₹{p.price}</option>
                            ))}
                          </select>
                          <input
                            placeholder="Item name (required)"
                            value={item.title}
                            onChange={(e) => updateLineItem(i, 'title', e.target.value)}
                            className="flex-1 min-w-[120px] px-2.5 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                          />
                          <input
                            type="number"
                            min={1}
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(i, 'quantity', e.target.value)}
                            className="w-14 px-2.5 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                          />
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder="0"
                            value={item.price || ''}
                            onChange={(e) => updateLineItem(i, 'price', e.target.value)}
                            className="w-20 px-2.5 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                          />
                          <button type="button" onClick={() => removeLineItem(i)} className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10" title="Remove item">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </>
                )}
                <div className="flex flex-wrap gap-4 items-center text-sm pt-2 border-t border-border-default">
                  <span className="text-text-secondary">Subtotal: ₹{subtotalRupees.toFixed(2)}</span>
                  <label className="flex items-center gap-2 text-text-secondary">
                    Shipping (₹)
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0"
                      value={form.shipping || ''}
                      onChange={(e) => setForm((f) => ({ ...f, shipping: Math.max(0, parseFloat(e.target.value) || 0) }))}
                      className="w-24 px-2.5 py-1.5 border border-border-default rounded-lg text-text-primary bg-surface-base text-sm"
                    />
                  </label>
                  <span className="font-medium text-text-primary">Total: ₹{totalRupees.toFixed(2)}</span>
                </div>
              </section>

              {editingId && (
                <section className="space-y-2">
                  <h3 className="text-sm font-medium text-text-primary">Status</h3>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="px-3 py-2.5 bg-surface-base border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  >
                    {STATUS_OPTIONS.filter((o) => o.value !== 'all').map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </section>
              )}
            </div>
            <div className="p-6 border-t border-border-default flex justify-end gap-3 shrink-0">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-lg border border-border-default text-text-primary hover:bg-surface-hover font-medium text-sm">
                Cancel
              </button>
              <button onClick={saveOrder} disabled={saving} className="px-4 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 font-medium text-sm inline-flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? 'Update order' : 'Create order'}
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
