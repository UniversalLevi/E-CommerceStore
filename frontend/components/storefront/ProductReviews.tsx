'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Star, Loader2, CheckCircle } from 'lucide-react';

interface ProductReviewsProps {
  storeSlug: string;
  productId: string;
  colors: Record<string, string>;
  themeName?: string;
}

export default function ProductReviews({ storeSlug, productId, colors, themeName = 'modern' }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<{ averageRating: number; totalCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ pages: number; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ authorName: '', authorEmail: '', rating: 5, title: '', body: '' });

  const fetchReviews = async (p: number = 1) => {
    try {
      setLoading(true);
      const res = await api.getProductReviews(storeSlug, productId, { page: p, limit: 5 });
      if (res.success && res.data) {
        setReviews(res.data.reviews || []);
        setStats(res.data.stats || null);
        setPagination(res.data.pagination || null);
      }
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(page);
  }, [storeSlug, productId, page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.authorName.trim() || !form.authorEmail.trim()) {
      notify.error('Name and email are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.createProductReview(storeSlug, productId, {
        authorName: form.authorName.trim(),
        authorEmail: form.authorEmail.trim(),
        rating: form.rating,
        title: form.title.trim() || undefined,
        body: form.body.trim() || undefined,
      });
      if (res.success) {
        setSubmitted(true);
        notify.success(res.data?.status === 'pending' ? 'Review submitted for moderation' : 'Thank you for your review!');
        setForm({ authorName: '', authorEmail: '', rating: 5, title: '', body: '' });
        fetchReviews(1);
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: themeName === 'dark-shade' ? 'rgba(26,26,26,0.8)' : themeName === 'cosmic-space' ? 'rgba(30,27,75,0.7)' : colors.secondary,
    borderColor: themeName === 'dark-shade' ? 'rgba(255,255,255,0.15)' : themeName === 'cosmic-space' ? 'rgba(167,139,250,0.4)' : colors.primary + '30',
    color: colors.text,
  };

  return (
    <div className="mt-10 pt-8 border-t" style={{ borderColor: colors.primary + '20' }}>
      <h3 className="text-xl font-semibold mb-4" style={{ color: colors.text }}>
        Customer Reviews
        {stats != null && (
          <span className="ml-2 text-sm font-normal" style={{ color: colors.text + 'CC' }}>
            ({stats.totalCount} {stats.totalCount === 1 ? 'review' : 'reviews'}
            {stats.averageRating > 0 && ` · ${stats.averageRating} avg`})
          </span>
        )}
      </h3>

      {loading && page === 1 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.accent }} />
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {reviews.length === 0 && !submitted ? (
              <p className="text-sm" style={{ color: colors.text + '99' }}>No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map((r: any) => (
                <div key={r._id} className="rounded-lg p-4" style={{ backgroundColor: colors.secondary + '80', border: `1px solid ${colors.primary}20` }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className="h-4 w-4"
                          style={{ color: i <= r.rating ? (colors.accent || '#f59e0b') : colors.text + '40' }}
                          fill={i <= r.rating ? (colors.accent || '#f59e0b') : 'transparent'}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium" style={{ color: colors.text }}>{r.authorName}</span>
                    {r.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: colors.accent }}>
                        <CheckCircle className="h-3.5 w-3.5" /> Verified purchase
                      </span>
                    )}
                    <span className="text-xs ml-auto" style={{ color: colors.text + '99' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {r.title && <p className="font-medium mt-1 text-sm" style={{ color: colors.text }}>{r.title}</p>}
                  {r.body && <p className="text-sm mt-1" style={{ color: colors.text + 'CC' }}>{r.body}</p>}
                </div>
              ))
            )}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex gap-2 mb-6">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className="px-3 py-1 rounded text-sm"
                  style={{
                    backgroundColor: page === p ? colors.accent : colors.secondary,
                    color: page === p ? '#fff' : colors.text,
                    border: `1px solid ${colors.primary}30`,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {!submitted && (
            <form onSubmit={handleSubmit} className="space-y-3 max-w-lg">
              <p className="text-sm font-medium" style={{ color: colors.text }}>Write a review</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.authorName}
                  onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
                  className="px-3 py-2 rounded-lg border w-full"
                  style={inputStyle}
                  required
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={form.authorEmail}
                  onChange={(e) => setForm((f) => ({ ...f, authorEmail: e.target.value }))}
                  className="px-3 py-2 rounded-lg border w-full"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <span className="text-sm mr-2" style={{ color: colors.text }}>Rating:</span>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: i }))}
                    className="p-1"
                  >
                    <Star
                      className="h-5 w-5"
                      style={{ color: i <= form.rating ? (colors.accent || '#f59e0b') : colors.text + '50' }}
                      fill={i <= form.rating ? (colors.accent || '#f59e0b') : 'transparent'}
                    />
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Review title (optional)"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="px-3 py-2 rounded-lg border w-full"
                style={inputStyle}
              />
              <textarea
                placeholder="Your review (optional)"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                className="px-3 py-2 rounded-lg border w-full min-h-[80px]"
                style={inputStyle}
                rows={3}
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: colors.accent }}
              >
                {submitting ? 'Submitting...' : 'Submit review'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
