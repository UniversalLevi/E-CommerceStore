'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import {
  Sparkles,
  Store,
  Hash,
  DollarSign,
  Calendar,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface StoreInfo {
  _id: string;
  storeName: string;
  shopDomain: string;
  status: string;
}

interface GeneratedOrder {
  id: number;
  name: string;
  totalPrice: string;
  currency: string;
  createdAt: string;
}

export default function AdminAutoOrdersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  const [count, setCount] = useState<number>(10);
  const [minTotal, setMinTotal] = useState<number>(20);
  const [maxTotal, setMaxTotal] = useState<number>(200);
  const [backfillDays, setBackfillDays] = useState<number>(30);
  const [markPaid, setMarkPaid] = useState<boolean>(true);
  const [markFulfilled, setMarkFulfilled] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);
  const [generatedOrders, setGeneratedOrders] = useState<GeneratedOrder[]>([]);

  // Guard: admin only
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Load active stores
  useEffect(() => {
    const loadStores = async () => {
      try {
        const response = await api.get<{
          success: boolean;
          data: StoreInfo[];
        }>('/api/stores?status=active');

        const activeStores = (response.data || []).filter(
          (s) => s.status === 'active'
        );
        setStores(activeStores);
        if (activeStores.length > 0) {
          setSelectedStoreId(activeStores[0]._id);
        }
      } catch (error: any) {
        console.error('Failed to load stores', error);
        notify.error(
          error?.response?.data?.error || 'Failed to load connected stores'
        );
      }
    };

    if (isAuthenticated && user?.role === 'admin') {
      loadStores();
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) {
      notify.error('Please select a store');
      return;
    }

    if (count <= 0 || count > 500) {
      notify.error('Count must be between 1 and 500');
      return;
    }
    if (minTotal <= 0 || maxTotal <= 0 || maxTotal < minTotal) {
      notify.error('Please enter a valid revenue range');
      return;
    }
    if (backfillDays <= 0 || backfillDays > 365) {
      notify.error('Backfill days must be between 1 and 365');
      return;
    }

    try {
      setSubmitting(true);
      setGeneratedOrders([]);

      const response = await api.post<{
        success: boolean;
        message: string;
        data: {
          summary: { requested: number; created: number };
          orders: GeneratedOrder[];
        };
      }>(`/api/auto-orders/${selectedStoreId}/generate`, {
        count,
        minTotal,
        maxTotal,
        backfillDays,
        markPaid,
        markFulfilled,
        currency: 'USD',
      });

      notify.success(response.message || 'Orders placed successfully');
      setGeneratedOrders(response.data.orders || []);
    } catch (error: any) {
      console.error('Failed to run auto place order automation', error);
      notify.error(
        error?.response?.data?.error ||
          'Failed to run auto place order automation. Please check store credentials and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              Auto Place Order Automation
            </h1>
            <p className="mt-2 text-text-secondary max-w-2xl">
              Automatically place realistic{' '}
              <span className="font-semibold">test</span> orders for any
              connected Shopify store to simulate sales and validate your
              dashboards. Orders are created in{' '}
              <span className="font-semibold">test mode</span> and do not affect
              real payments.
            </p>
          </div>
        </div>

        {/* Main card */}
        <div className="grid lg:grid-cols-[2fr,1.5fr] gap-6">
          {/* Form */}
          <div className="bg-surface-raised border border-border-default rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Configuration
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Store */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Target Store
                </label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-elevated border border-border-default rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {stores.length === 0 && (
                    <option value="">No active stores connected</option>
                  )}
                  {stores.map((store) => (
                    <option key={store._id} value={store._id}>
                      {store.storeName} ({store.shopDomain})
                    </option>
                  ))}
                </select>
              </div>

              {/* Count */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Number of orders
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-surface-elevated border border-border-default rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-text-muted">
                  Recommended: 10–200 orders for most demos.
                </p>
              </div>

              {/* Revenue range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Min total (USD)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={minTotal}
                    onChange={(e) => setMinTotal(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-surface-elevated border border-border-default rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">
                    Max total (USD)
                  </label>
                  <input
                    type="number"
                    min={minTotal}
                    value={maxTotal}
                    onChange={(e) => setMaxTotal(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-surface-elevated border border-border-default rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Backfill */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Distribute over last N days
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={backfillDays}
                  onChange={(e) => setBackfillDays(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-surface-elevated border border-border-default rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-text-muted">
                  Orders will be backdated randomly within this window to
                  simulate natural sales history.
                </p>
              </div>

              {/* Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markPaid}
                    onChange={(e) => setMarkPaid(e.target.checked)}
                    className="h-4 w-4 rounded border-border-default bg-surface-elevated text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-text-secondary">
                    Mark as paid
                  </span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markFulfilled}
                    onChange={(e) => setMarkFulfilled(e.target.checked)}
                    className="h-4 w-4 rounded border-border-default bg-surface-elevated text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-text-secondary">
                    Mark as fulfilled
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedStoreId}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-black shadow-lg shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed hover:from-purple-400 hover:to-blue-400 transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Placing test orders...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Run auto place order automation
                  </>
                )}
              </button>

              <p className="text-[11px] text-text-muted leading-relaxed">
                This tool uses Shopify&apos;s Orders API with{' '}
                <span className="font-semibold">test=true</span> orders only.
                Use it for analytics demos, dashboard stress-testing, and QA.
                It is not intended for manipulating real store performance
                metrics.
              </p>
            </form>
          </div>

          {/* Result / Preview */}
          <div className="bg-surface-raised border border-border-default rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Latest run
            </h2>

            {generatedOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-default bg-surface-elevated/40 p-6 text-center space-y-3">
                <p className="text-sm font-medium text-text-primary">
                  No orders placed yet
                </p>
                <p className="text-xs text-text-muted max-w-xs mx-auto">
                  Configure your store, volume, and revenue range on the left,
                  then run the automation to see a summary here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-text-secondary">
                  Placed{' '}
                  <span className="font-semibold text-text-primary">
                    {generatedOrders.length}
                  </span>{' '}
                  test orders. Here are the latest ones:
                </p>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {generatedOrders.slice(0, 10).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-surface-elevated border border-border-default"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {order.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-emerald-400">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: order.currency || 'USD',
                        }).format(parseFloat(order.totalPrice || '0'))}
                      </div>
                    </div>
                  ))}
                </div>
                {generatedOrders.length > 10 && (
                  <p className="text-[11px] text-text-muted">
                    + {generatedOrders.length - 10} more orders created in this
                    run.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


