'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import LoadingScreen from '@/components/LoadingScreen';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
  Sparkles,
  DollarSign,
  Tag,
  FileText,
} from 'lucide-react';

interface Niche {
  _id: string;
  name: string;
  icon?: string;
}

interface WhatsAppDraft {
  _id: string;
  whatsapp_message_id: string;
  original_image_url: string;
  generated_image_urls: string[];
  images_ai_generated: boolean;
  original_name: string;
  ai_name: string;
  cost_price: number;
  profit_margin: number;
  shipping_fee: number;
  final_price: number;
  ai_description: string;
  description_source: string;
  detected_niche?: Niche;
  status: 'incoming' | 'enriched' | 'approved' | 'rejected';
  needs_review: boolean;
  error_log: string[];
  createdAt: string;
  updatedAt: string;
}

export default function WhatsAppDraftDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const draftId = params.id as string;

  const [draft, setDraft] = useState<WhatsAppDraft | null>(null);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    ai_name: '',
    ai_description: '',
    cost_price: 0,
    profit_margin: 0,
    shipping_fee: 80,
    detected_niche: '',
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (draftId) {
      fetchDraft();
    }
  }, [draftId]);

  // Update formData when draft changes (e.g., after enrichment completes)
  useEffect(() => {
    if (draft) {
      setFormData(prev => ({
        ...prev,
        ai_name: draft.ai_name || draft.original_name || prev.ai_name,
        ai_description: draft.ai_description || prev.ai_description,
        detected_niche: draft.detected_niche?._id || prev.detected_niche,
      }));
    }
  }, [draft]);

  // Auto-refresh if draft is being enriched and missing niche
  useEffect(() => {
    if (draft && !draft.detected_niche && (draft.status === 'incoming' || draft.status === 'enriched')) {
      const interval = setInterval(() => {
        fetchDraft();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [draft]);

  const fetchDraft = async () => {
    try {
      setLoadingDraft(true);
      const response = await api.get<{
        success: boolean;
        data: WhatsAppDraft;
        niches: Niche[];
      }>(`/api/whatsapp/drafts/${draftId}`);

      setDraft(response.data);
      setNiches(response.niches);

      // Initialize form with draft data
      setFormData({
        ai_name: response.data.ai_name || response.data.original_name,
        ai_description: response.data.ai_description || '',
        cost_price: response.data.cost_price,
        profit_margin: response.data.profit_margin,
        shipping_fee: response.data.shipping_fee,
        detected_niche: response.data.detected_niche?._id || '',
      });
    } catch (err: any) {
      notify.error('Failed to load draft');
      router.push('/admin/whatsapp-drafts');
    } finally {
      setLoadingDraft(false);
    }
  };

  const calculateFinalPrice = () => {
    return formData.cost_price + formData.profit_margin + formData.shipping_fee;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/api/whatsapp/drafts/${draftId}`, formData);
      notify.success('Draft saved successfully');
      fetchDraft();
    } catch (err: any) {
      notify.error(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    // Refresh draft data first to ensure we have latest niche
    if (!formData.detected_niche) {
      // Try to refresh the draft in case enrichment just completed
      await fetchDraft();
      
      if (!formData.detected_niche && !draft?.detected_niche) {
        notify.error('Please select a niche before approving. If enrichment is still running, please wait and refresh the page.');
        return;
      }
      
      // Update formData with refreshed draft niche
      if (draft?.detected_niche) {
        setFormData(prev => ({ ...prev, detected_niche: (draft.detected_niche as any)._id }));
      }
    }

    if (!confirm('Approve this draft and create a product?')) return;

    try {
      setApproving(true);
      await api.post(`/api/whatsapp/drafts/${draftId}/approve`);
      notify.success('Product created successfully!');
      router.push('/admin/whatsapp-drafts');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to approve draft';
      if (errorMsg.includes('niche')) {
        notify.error('Please select a niche before approving. You can select one from the dropdown above.');
      } else {
        notify.error(errorMsg);
      }
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Reject this draft? This action cannot be undone.')) return;

    try {
      await api.delete(`/api/whatsapp/drafts/${draftId}`);
      notify.success('Draft rejected');
      router.push('/admin/whatsapp-drafts');
    } catch (err: any) {
      notify.error(err.message || 'Failed to reject draft');
    }
  };

  const getImageUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    // Always use backend URL for images
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    // Remove trailing slash from baseUrl and leading slash from path if present
    const cleanBase = baseUrl.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  };

  if (loading || loadingDraft) {
    return <LoadingScreen />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (!draft) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Draft not found</p>
      </div>
    );
  }

  const isReadOnly = draft.status === 'approved' || draft.status === 'rejected';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/whatsapp-drafts"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Drafts
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {draft.ai_name || draft.original_name}
            </h1>
            <p className="text-sm text-text-muted mt-1">
              WhatsApp Message ID: {draft.whatsapp_message_id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {draft.status === 'approved' && (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                <CheckCircle className="w-4 h-4" />
                Approved
              </span>
            )}
            {draft.status === 'rejected' && (
              <span className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                <XCircle className="w-4 h-4" />
                Rejected
              </span>
            )}
            {draft.needs_review && draft.status !== 'approved' && draft.status !== 'rejected' && (
              <span className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                <AlertTriangle className="w-4 h-4" />
                Needs Review
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Log */}
      {draft.error_log && draft.error_log.length > 0 && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
          <h3 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Processing Errors
          </h3>
          <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
            {draft.error_log.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Images */}
        <div className="space-y-6">
          {/* Original Image */}
          <div className="bg-surface-raised border border-border-default rounded-xl p-4">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Original Image
            </h3>
            {draft.original_image_url && (
              <img
                src={getImageUrl(draft.original_image_url)}
                alt="Original product"
                className="w-full max-h-80 object-contain rounded-lg bg-surface-elevated"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x800/E2E8F0/64748B?text=Image+Not+Found';
                }}
              />
            )}
          </div>

          {/* AI Generated Images */}
          {draft.generated_image_urls && draft.generated_image_urls.length > 0 && (
            <div className="bg-surface-raised border border-border-default rounded-xl p-4">
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Generated Variations ({draft.generated_image_urls.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {draft.generated_image_urls.map((url, idx) => (
                  <img
                    key={idx}
                    src={getImageUrl(url)}
                    alt={`AI variation ${idx + 1}`}
                    className="w-full h-40 object-cover rounded-lg bg-surface-elevated"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400/E2E8F0/64748B?text=AI+Image+${idx + 1}';
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Form */}
        <div className="space-y-6">
          {/* Product Name */}
          <div className="bg-surface-raised border border-border-default rounded-xl p-4">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Product Name
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Original Name</label>
                <p className="text-sm text-text-secondary bg-surface-elevated p-2 rounded">
                  {draft.original_name}
                </p>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">AI Optimized Name</label>
                <input
                  type="text"
                  value={formData.ai_name}
                  onChange={(e) => setFormData({ ...formData, ai_name: e.target.value })}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-surface-raised border border-border-default rounded-xl p-4">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing (INR)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-muted mb-1">Cost Price</label>
                <input
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Profit Margin</label>
                <input
                  type="number"
                  value={formData.profit_margin}
                  onChange={(e) => setFormData({ ...formData, profit_margin: parseFloat(e.target.value) || 0 })}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Shipping Fee</label>
                <input
                  type="number"
                  value={formData.shipping_fee}
                  onChange={(e) => setFormData({ ...formData, shipping_fee: parseFloat(e.target.value) || 0 })}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Final Price</label>
                <div className="px-3 py-2 bg-green-900/30 border border-green-500/30 text-green-400 font-semibold rounded-lg">
                  ₹{calculateFinalPrice()}
                </div>
              </div>
            </div>
          </div>

          {/* Niche Selection */}
          <div className="bg-surface-raised border border-border-default rounded-xl p-4">
            <h3 className="font-semibold text-text-primary mb-3">Niche Category</h3>
            <select
              value={formData.detected_niche}
              onChange={(e) => setFormData({ ...formData, detected_niche: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:opacity-50"
            >
              <option value="">Select a niche...</option>
              {niches.map((niche) => (
                <option key={niche._id} value={niche._id}>
                  {niche.icon} {niche.name}
                </option>
              ))}
            </select>
            {!formData.detected_niche && !isReadOnly && (
              <p className="text-xs text-yellow-400 mt-2">
                A niche must be selected before approving
              </p>
            )}
          </div>

          {/* Description */}
          <div className="bg-surface-raised border border-border-default rounded-xl p-4">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Product Description
              {draft.description_source === 'ai_whatsapp_intake' && (
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                  AI Generated
                </span>
              )}
            </h3>
            <textarea
              value={formData.ai_description}
              onChange={(e) => setFormData({ ...formData, ai_description: e.target.value })}
              disabled={isReadOnly}
              rows={8}
              className="w-full px-3 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:opacity-50 resize-none"
              placeholder="Product description..."
            />
          </div>

          {/* Actions */}
          {!isReadOnly && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-surface-elevated hover:bg-surface-hover border border-border-default text-text-primary rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleApprove}
                disabled={approving || !formData.detected_niche}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                {approving ? 'Creating Product...' : 'Approve & Create Product'}
              </button>
              <button
                onClick={handleReject}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-text-muted space-y-1">
            <p>Created: {new Date(draft.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(draft.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

