'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';

export default function AdminInternalStoreOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [store, setStore] = useState<{ name: string; slug: string } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
    else if (!authLoading && user?.role !== 'admin') router.push('/dashboard');
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin' && storeId) {
      fetchStore();
    }
  }, [isAuthenticated, user, storeId]);

  useEffect(() => {
    if (store && storeId) fetchOrders();
  }, [storeId, store, pagination.page]);

  const fetchStore = async () => {
    try {
      const res = await api.getAdminInternalStore(storeId);
      if (res.success && res.data) setStore(res.data);
    } catch (e: any) {
      notify.error(e?.response?.data?.error || 'Failed to load store');
      router.push('/admin/internal-stores');
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminInternalStoreOrders(storeId, { page: pagination.page, limit: pagination.limit });
      if (res.success) {
        setOrders(Array.isArray(res.data) ? res.data : []);
        if (res.pagination) setPagination((p) => ({ ...p, ...res.pagination }));
      }
    } catch (e: any) {
      notify.error(e?.response?.data?.error || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !store) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base p-6">
      <div className="max-w-6xl mx-auto">
        <Link
          href={`/admin/internal-stores/${storeId}`}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {store.name}
        </Link>
        <h1 className="text-2xl font-bold text-text-primary mb-2 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          Orders
        </h1>
        <p className="text-text-secondary mb-6">{store.slug} · Internal store</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-surface-raised border border-border-default rounded-xl p-8 text-center text-text-secondary">
            No orders yet.
          </div>
        ) : (
          <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-surface-elevated border-b border-border-default">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary">Order ID</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary">Customer</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary">Total</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary">Payment</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-surface-hover/50">
                    <td className="px-4 py-3 text-text-primary font-mono text-sm">{o.orderId || o._id}</td>
                    <td className="px-4 py-3 text-text-primary">{o.customer?.name || o.customer?.email || '—'}</td>
                    <td className="px-4 py-3 text-text-primary">
                      {o.currency || 'INR'} {(o.total ?? 0) / 100}
                    </td>
                    <td className="px-4 py-3 text-text-primary">{o.paymentStatus || '—'}</td>
                    <td className="px-4 py-3 text-text-muted text-sm">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-border-default flex justify-between items-center text-sm text-text-muted">
                <span>
                  Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    className="px-3 py-1 rounded bg-surface-elevated disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    className="px-3 py-1 rounded bg-surface-elevated disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
