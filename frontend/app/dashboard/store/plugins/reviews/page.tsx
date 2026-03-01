'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Save, Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ReviewsPluginPage() {
  const { store } = useStore();
  const [config, setConfig] = useState({ enabled: true, moderate: true, showVerifiedBadge: true, minRatingToDisplay: 0 });
  const [reviews, setReviews] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (store?._id) {
      loadConfig();
      loadReviews();
    }
  }, [store?._id]);

  useEffect(() => {
    if (store?._id) loadReviews();
  }, [store?._id, statusFilter, page]);

  const loadConfig = async () => {
    try {
      const res = await api.getStorePlugins(store._id);
      if (res.success) {
        const p = res.data.find((x: any) => x.slug === 'product-reviews');
        if (p?.storeConfig?.config) setConfig((c) => ({ ...c, ...p.storeConfig.config }));
      }
    } catch {
      // ignore
    }
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await api.getStoreReviews(store._id, { status: statusFilter || undefined, page, limit: 20 });
      if (res.success && res.data) {
        setReviews(res.data.reviews || []);
        setPagination(res.data.pagination || null);
      }
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await api.updatePluginConfig(store._id, 'product-reviews', config);
      notify.success('Saved');
    } catch {
      notify.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (reviewId: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      await api.updateReviewStatus(store._id, reviewId, status);
      notify.success('Updated');
      loadReviews();
    } catch {
      notify.error('Failed to update');
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      await api.deleteReview(store._id, reviewId);
      notify.success('Deleted');
      loadReviews();
    } catch {
      notify.error('Failed to delete');
    }
  };

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Product Reviews & Social Proof</h1>
        <p className="text-gray-400 mt-1">Collect and display product reviews; show verified purchase badges</p>
      </div>

      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} className="w-4 h-4 rounded" />
          <span className="text-white">Enable reviews on storefront</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={config.moderate} onChange={(e) => setConfig({ ...config, moderate: e.target.checked })} className="w-4 h-4 rounded" />
          <span className="text-white">Moderate reviews (approve before they appear)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={config.showVerifiedBadge} onChange={(e) => setConfig({ ...config, showVerifiedBadge: e.target.checked })} className="w-4 h-4 rounded" />
          <span className="text-white">Show “Verified purchase” badge</span>
        </label>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Minimum rating to display (0 = show all)</label>
          <select
            value={config.minRatingToDisplay}
            onChange={(e) => setConfig({ ...config, minRatingToDisplay: Number(e.target.value) })}
            className="w-full max-w-xs px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white"
          >
            <option value={0}>All</option>
            <option value={1}>1+</option>
            <option value={2}>2+</option>
            <option value={3}>3+</option>
            <option value={4}>4+</option>
            <option value={5}>5 only</option>
          </select>
        </div>
        <button onClick={saveConfig} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save settings
        </button>
      </div>

      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Reviews</h2>
        <div className="flex gap-2 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>
        ) : reviews.length === 0 ? (
          <p className="text-gray-400">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r: any) => (
              <div key={r._id} className="p-4 rounded-lg border border-gray-700 bg-[#0d0d1a]">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{r.authorName}</span>
                      <span className="text-sm text-gray-400">{r.authorEmail}</span>
                      <span className="inline-flex items-center gap-1 text-sm text-amber-400">
                        {[1,2,3,4,5].map((i) => <Star key={i} className="h-4 w-4" fill={i <= r.rating ? 'currentColor' : 'none'} />)}
                        {r.rating}
                      </span>
                      {r.verifiedPurchase && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Verified</span>}
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{r.productId?.title || 'Product'}</p>
                    {r.title && <p className="font-medium text-white mt-1">{r.title}</p>}
                    {r.body && <p className="text-sm text-gray-400 mt-1">{r.body}</p>}
                    <p className="text-xs text-gray-500 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${r.status === 'approved' ? 'bg-green-500/20 text-green-400' : r.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{r.status}</span>
                    {r.status !== 'approved' && <button type="button" onClick={() => updateStatus(r._id, 'approved')} className="p-1.5 rounded bg-green-600 text-white hover:bg-green-700" title="Approve"><CheckCircle className="h-4 w-4" /></button>}
                    {r.status !== 'rejected' && <button type="button" onClick={() => updateStatus(r._id, 'rejected')} className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700" title="Reject"><XCircle className="h-4 w-4" /></button>}
                    <button type="button" onClick={() => deleteReview(r._id)} className="p-1.5 rounded bg-gray-600 text-white hover:bg-gray-700" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {pagination && pagination.pages > 1 && (
          <div className="flex gap-2 mt-4">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded text-sm ${page === p ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>

      <Link href="/dashboard/store/plugins" className="inline-block text-purple-400 hover:text-purple-300 text-sm">Back to Plugins</Link>
    </div>
  );
}
