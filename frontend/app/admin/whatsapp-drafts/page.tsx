'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import LoadingScreen from '@/components/LoadingScreen';
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  Trash2,
  CheckSquare,
  RefreshCw,
} from 'lucide-react';

interface WhatsAppDraft {
  _id: string;
  whatsapp_message_id: string;
  original_image_url: string;
  generated_image_urls: string[];
  original_name: string;
  ai_name: string;
  cost_price: number;
  profit_margin: number;
  shipping_fee: number;
  final_price: number;
  status: 'incoming' | 'enriched' | 'approved' | 'rejected';
  needs_review: boolean;
  detected_niche?: {
    _id: string;
    name: string;
    icon?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface DraftStats {
  incoming: number;
  enriched: number;
  approved: number;
  rejected: number;
  total: number;
  pending_review: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function WhatsAppDraftsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [drafts, setDrafts] = useState<WhatsAppDraft[]>([]);
  const [stats, setStats] = useState<DraftStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [needsReviewFilter, setNeedsReviewFilter] = useState(false);
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchDrafts();
    fetchStats();
  }, [statusFilter, needsReviewFilter, pagination.page]);

  const fetchStats = async () => {
    try {
      const response = await api.get<{ success: boolean; data: DraftStats }>(
        '/api/whatsapp/drafts/stats'
      );
      setStats(response.data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchDrafts = async () => {
    try {
      setLoadingDrafts(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', '20');
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (needsReviewFilter) {
        params.append('needs_review', 'true');
      }

      const response = await api.get<{
        success: boolean;
        data: WhatsAppDraft[];
        pagination: Pagination;
      }>(`/api/whatsapp/drafts?${params.toString()}`);

      setDrafts(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      notify.error('Failed to load drafts');
    } finally {
      setLoadingDrafts(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to reject this draft?')) return;

    try {
      await api.delete(`/api/whatsapp/drafts/${id}`);
      notify.success('Draft rejected');
      fetchDrafts();
      fetchStats();
    } catch (err: any) {
      notify.error('Failed to reject draft');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedDrafts.size === 0) {
      notify.error('No drafts selected');
      return;
    }

    if (!confirm(`Approve ${selectedDrafts.size} drafts and create products?`)) return;

    try {
      setBulkLoading(true);
      const response = await api.post<{
        success: boolean;
        message: string;
        data: { id: string; success: boolean; error?: string }[];
      }>('/api/whatsapp/drafts/bulk-approve', {
        ids: Array.from(selectedDrafts),
      });

      const successCount = response.data.filter(r => r.success).length;
      const failCount = response.data.filter(r => !r.success).length;

      if (failCount > 0) {
        notify.success(`Approved ${successCount} drafts. ${failCount} failed.`);
      } else {
        notify.success(`Successfully approved ${successCount} drafts`);
      }

      setSelectedDrafts(new Set());
      fetchDrafts();
      fetchStats();
    } catch (err: any) {
      notify.error('Bulk approve failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelectDraft = (id: string) => {
    const newSelected = new Set(selectedDrafts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDrafts(newSelected);
  };

  const selectAllEnriched = () => {
    const enrichedIds = drafts
      .filter(d => d.status === 'enriched' && !d.needs_review)
      .map(d => d._id);
    setSelectedDrafts(new Set(enrichedIds));
  };

  const getStatusBadge = (status: string, needsReview: boolean) => {
    if (needsReview && status !== 'approved' && status !== 'rejected') {
      return (
        <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">
          <AlertCircle className="w-3 h-3" />
          Needs Review
        </span>
      );
    }

    switch (status) {
      case 'incoming':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/50">
            <Clock className="w-3 h-3" />
            Incoming
          </span>
        );
      case 'enriched':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/50">
            <MessageSquare className="w-3 h-3" />
            Enriched
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/50">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/50">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (loading || loadingDrafts) {
    return <LoadingScreen />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-green-500" />
            WhatsApp Product Drafts
          </h1>
          <p className="text-text-secondary mt-1">
            Review and approve products received via WhatsApp
          </p>
        </div>
        <button
          onClick={() => { fetchDrafts(); fetchStats(); }}
          className="flex items-center gap-2 px-4 py-2 bg-surface-elevated hover:bg-surface-hover border border-border-default rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-surface-raised border border-border-default rounded-xl p-4">
            <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
            <div className="text-sm text-text-secondary">Total Drafts</div>
          </div>
          <div className="bg-surface-raised border border-blue-500/30 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.incoming}</div>
            <div className="text-sm text-text-secondary">Incoming</div>
          </div>
          <div className="bg-surface-raised border border-purple-500/30 rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-400">{stats.enriched}</div>
            <div className="text-sm text-text-secondary">Ready to Approve</div>
          </div>
          <div className="bg-surface-raised border border-green-500/30 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
            <div className="text-sm text-text-secondary">Approved</div>
          </div>
          <div className="bg-surface-raised border border-yellow-500/30 rounded-xl p-4">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending_review}</div>
            <div className="text-sm text-text-secondary">Needs Review</div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="incoming">Incoming</option>
            <option value="enriched">Enriched</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={needsReviewFilter}
              onChange={(e) => { setNeedsReviewFilter(e.target.checked); setPagination(p => ({ ...p, page: 1 })); }}
              className="w-4 h-4 rounded border-border-default bg-surface-elevated text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-text-secondary">Needs Review Only</span>
          </label>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button
            onClick={selectAllEnriched}
            className="px-4 py-2 text-sm bg-surface-elevated hover:bg-surface-hover border border-border-default rounded-lg transition-colors"
          >
            Select Ready
          </button>
          <button
            onClick={handleBulkApprove}
            disabled={selectedDrafts.size === 0 || bulkLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {bulkLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckSquare className="w-4 h-4" />
            )}
            Approve Selected ({selectedDrafts.size})
          </button>
        </div>
      </div>

      {/* Drafts Table */}
      {drafts.length === 0 ? (
        <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-12 text-center">
          <MessageSquare className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary mb-2">No drafts found</p>
          <p className="text-sm text-text-muted">
            Send product images via WhatsApp to start adding products
          </p>
        </div>
      ) : (
        <div className="bg-surface-raised border border-border-default rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-surface-elevated border-b border-border-default">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllEnriched();
                        } else {
                          setSelectedDrafts(new Set());
                        }
                      }}
                      className="w-4 h-4 rounded border-border-default bg-surface-elevated text-primary-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Niche
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Images
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {drafts.map((draft) => (
                  <tr key={draft._id} className="hover:bg-surface-hover">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedDrafts.has(draft._id)}
                        onChange={() => toggleSelectDraft(draft._id)}
                        disabled={draft.status !== 'enriched' || draft.needs_review}
                        className="w-4 h-4 rounded border-border-default bg-surface-elevated text-primary-500 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {draft.original_image_url && (
                          <img
                            src={(() => {
                              if (draft.original_image_url.startsWith('http')) return draft.original_image_url;
                              const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                              const cleanBase = baseUrl.replace(/\/$/, '');
                              const cleanPath = draft.original_image_url.startsWith('/') ? draft.original_image_url : `/${draft.original_image_url}`;
                              return `${cleanBase}${cleanPath}`;
                            })()}
                            alt={draft.original_name}
                            className="w-12 h-12 object-cover rounded-lg"
                            onError={(e) => {
                              // Fallback to placeholder if image fails to load
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x800/E2E8F0/64748B?text=Image+Not+Found';
                            }}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {draft.ai_name || draft.original_name}
                          </div>
                          {draft.ai_name && draft.ai_name !== draft.original_name && (
                            <div className="text-xs text-text-muted">
                              Original: {draft.original_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {draft.detected_niche ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-primary-500/20 text-primary-400">
                          {draft.detected_niche.icon && <span>{draft.detected_niche.icon}</span>}
                          {draft.detected_niche.name}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <div className="text-text-primary font-medium">₹{draft.final_price}</div>
                        <div className="text-xs text-text-muted">
                          Cost: ₹{draft.cost_price} + ₹{draft.profit_margin} + ₹{draft.shipping_fee}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-text-primary">
                          {1 + draft.generated_image_urls.length}
                        </span>
                        <span className="text-xs text-text-muted">
                          ({draft.generated_image_urls.length} AI)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(draft.status, draft.needs_review)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/whatsapp-drafts/${draft._id}`}
                          className="p-2 text-primary-500 hover:bg-primary-500/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {draft.status !== 'approved' && draft.status !== 'rejected' && (
                          <button
                            onClick={() => handleDelete(draft._id)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border-default">
              <div className="text-sm text-text-secondary">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm bg-surface-elevated hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed border border-border-default rounded-lg"
                >
                  Previous
                </button>
                <span className="text-sm text-text-secondary">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 text-sm bg-surface-elevated hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed border border-border-default rounded-lg"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

