'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import SubscriptionLock from '@/components/SubscriptionLock';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import {
  Palette,
  Eye,
  Sparkles,
  Loader2,
  Search,
  Filter,
  Store,
  CheckCircle,
  ArrowRight,
  X,
  FileCode,
  FileJson,
  File,
  Layers,
  Home,
  RefreshCw,
} from 'lucide-react';

interface Template {
  _id: string;
  name: string;
  slug: string;
  description: string;
  previewImage: string;
  category: 'minimal' | 'modern' | 'luxury' | 'bold' | 'custom';
  appliedCount: number;
  createdAt: string;
  preview?: {
    sections: string[];
    templates: string[];
    assets: string[];
    pages: string[];
  };
}

interface StoreConnection {
  _id: string;
  storeName: string;
  shopDomain: string;
  isDefault: boolean;
  status: string;
}

const categoryLabels: Record<string, { label: string; color: string; bgColor: string }> = {
  minimal: { label: 'Minimal', color: 'text-slate-300', bgColor: 'bg-slate-700' },
  modern: { label: 'Modern', color: 'text-blue-300', bgColor: 'bg-blue-700' },
  luxury: { label: 'Luxury', color: 'text-amber-300', bgColor: 'bg-amber-700' },
  bold: { label: 'Bold', color: 'text-rose-300', bgColor: 'bg-rose-700' },
  custom: { label: 'Custom', color: 'text-purple-300', bgColor: 'bg-purple-700' },
};

export default function TemplatesPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stores, setStores] = useState<StoreConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStores, setLoadingStores] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  
  // Preview modal state
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    template: Template | null;
  }>({
    isOpen: false,
    template: null,
  });
  
  // Apply template modal state
  const [applyModal, setApplyModal] = useState<{
    isOpen: boolean;
    template: Template | null;
    selectedStoreId: string;
    applying: boolean;
    progress: string;
  }>({
    isOpen: false,
    template: null,
    selectedStoreId: '',
    applying: false,
    progress: '',
  });

  // Default theme modal state
  const [defaultThemeModal, setDefaultThemeModal] = useState<{
    isOpen: boolean;
    storeId: string;
    themes: any[];
    loading: boolean;
    settingDefault: boolean;
  }>({
    isOpen: false,
    storeId: '',
    themes: [],
    loading: false,
    settingDefault: false,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      
      const response = await api.get<{ success: boolean; data: Template[] }>(
        `/api/templates?${params.toString()}`
      );
      setTemplates(response.data);
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  const fetchStores = useCallback(async () => {
    try {
      setLoadingStores(true);
      const response = await api.get<{ success: boolean; data: StoreConnection[] }>(
        '/api/stores'
      );
      setStores(response.data.filter(s => s.status === 'active'));
    } catch (error: any) {
      console.error('Failed to load stores:', error);
    } finally {
      setLoadingStores(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTemplates();
      fetchStores();
    }
  }, [isAuthenticated, fetchTemplates, fetchStores]);

  const openPreview = async (template: Template) => {
    try {
      const response = await api.get<{ success: boolean; data: Template }>(
        `/api/templates/${template._id}`
      );
      setPreviewModal({
        isOpen: true,
        template: response.data,
      });
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to load template details');
    }
  };

  const openApplyModal = (template: Template) => {
    if (stores.length === 0) {
      notify.error('Please connect a Shopify store first');
      router.push('/dashboard/stores/connect');
      return;
    }
    
    const defaultStore = stores.find(s => s.isDefault) || stores[0];
    setApplyModal({
      isOpen: true,
      template,
      selectedStoreId: defaultStore._id,
      applying: false,
      progress: '',
    });
  };

  const applyTemplate = async () => {
    if (!applyModal.template || !applyModal.selectedStoreId) return;

    try {
      setApplyModal(prev => ({
        ...prev,
        applying: true,
        progress: 'Applying template to your store...',
      }));

      const response = await api.post<{
        success: boolean;
        message: string;
        data: {
          themeId: number;
          themeName: string;
          assetsUploaded: number;
          pagesCreated: number;
          errors: string[];
          storeUrl: string;
          adminUrl: string;
        };
      }>(`/api/templates/${applyModal.template._id}/apply`, {
        storeId: applyModal.selectedStoreId,
      });

      if (response.data.errors.length > 0) {
        notify.warning(`Template applied with ${response.data.errors.length} warnings`);
      } else {
        notify.success('Template applied successfully!');
      }

      setApplyModal({
        isOpen: false,
        template: null,
        selectedStoreId: '',
        applying: false,
        progress: '',
      });

      // Optionally redirect to store page
      // router.push(`/dashboard/stores/${applyModal.selectedStoreId}`);
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to apply template');
      setApplyModal(prev => ({
        ...prev,
        applying: false,
        progress: '',
      }));
    }
  };

  const filteredTemplates = templates.filter((template) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const openDefaultThemeModal = async (storeId: string) => {
    setDefaultThemeModal({
      isOpen: true,
      storeId,
      themes: [],
      loading: true,
      settingDefault: false,
    });

    try {
      const response = await api.getStoreThemes(storeId);
      setDefaultThemeModal(prev => ({
        ...prev,
        themes: response.data || [],
        loading: false,
      }));
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to load themes');
      setDefaultThemeModal(prev => ({
        ...prev,
        loading: false,
      }));
    }
  };

  const handleSetDefaultTheme = async (themeId: number) => {
    if (!defaultThemeModal.storeId) {
      notify.error('Store ID is missing');
      return;
    }

    if (!themeId || isNaN(themeId)) {
      notify.error('Invalid theme ID');
      return;
    }

    try {
      setDefaultThemeModal(prev => ({ ...prev, settingDefault: true }));
      const response = await api.setDefaultTheme(defaultThemeModal.storeId, themeId);
      notify.success(response.message || 'Default theme set successfully!');
      
      // Refresh themes
      const themesResponse = await api.getStoreThemes(defaultThemeModal.storeId);
      setDefaultThemeModal(prev => ({
        ...prev,
        themes: themesResponse.data || [],
        settingDefault: false,
      }));
    } catch (error: any) {
      console.error('Error setting default theme:', error);
      notify.error(error.response?.data?.error || error.response?.data?.message || 'Failed to set default theme');
      setDefaultThemeModal(prev => ({ ...prev, settingDefault: false }));
    }
  };

  // Check subscription
  if (!authLoading && isAuthenticated && !hasActiveSubscription) {
    return <SubscriptionLock featureName="Templates" />;
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto" />
          <p className="mt-4 text-text-secondary">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Palette className="h-8 w-8 text-purple-500" />
          Store Templates
        </h1>
        <p className="text-text-secondary mt-2">
          Choose a template to instantly transform your Shopify store's look and feel
        </p>
      </div>

      {/* Filters */}
      <div className="bg-surface-raised border border-border-default rounded-xl p-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-base border border-border-default rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-text-secondary" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-surface-base border border-border-default rounded-lg px-3 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Categories</option>
              <option value="minimal">Minimal</option>
              <option value="modern">Modern</option>
              <option value="luxury">Luxury</option>
              <option value="bold">Bold</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </div>

      {/* Set Default Theme Section */}
      {stores.length > 0 && (
        <div className="bg-surface-raised border border-border-default rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                <Home className="h-5 w-5 text-purple-500" />
                Manage Store Themes
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Set a theme as your store's default theme. This is useful if a custom theme doesn't work and you need to switch back.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {stores.map((store) => (
              <div
                key={store._id}
                className="bg-surface-base border border-border-default rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Store className="h-5 w-5 text-text-secondary" />
                  <div>
                    <p className="font-medium text-text-primary">{store.storeName}</p>
                    <p className="text-xs text-text-secondary">{store.shopDomain}</p>
                  </div>
                </div>
                <button
                  onClick={() => openDefaultThemeModal(store._id)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Home className="h-4 w-4" />
                  Set Default Theme
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-surface-raised border border-border-default rounded-xl p-12 text-center">
          <Layers className="h-16 w-16 text-text-secondary/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No templates available
          </h3>
          <p className="text-text-secondary">
            {searchQuery || categoryFilter
              ? 'Try adjusting your filters'
              : 'Templates will appear here once added by admin'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const category = categoryLabels[template.category];
            
            return (
              <div
                key={template._id}
                className="bg-surface-raised border border-border-default rounded-xl overflow-hidden hover:shadow-xl hover:border-purple-500/30 transition-all group"
              >
                {/* Preview Image */}
                <div className="relative aspect-[4/3] bg-surface-base overflow-hidden">
                  {template.previewImage ? (
                    <Image
                      src={template.previewImage}
                      alt={template.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                      <Palette className="h-20 w-20 text-text-secondary/20" />
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${category.bgColor} ${category.color}`}>
                      {category.label}
                    </span>
                  </div>

                  {/* Applied Count */}
                  {template.appliedCount > 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-black/50 text-white flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {template.appliedCount} used
                      </span>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => openPreview(template)}
                      className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                      title="Preview"
                    >
                      <Eye className="h-5 w-5 text-white" />
                    </button>
                    <button
                      onClick={() => openApplyModal(template)}
                      className="p-3 bg-purple-600 rounded-full hover:bg-purple-700 transition-colors"
                      title="Use Template"
                    >
                      <Sparkles className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {template.name}
                  </h3>
                  <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                    {template.description}
                  </p>
                  
                  <button
                    onClick={() => openApplyModal(template)}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    Use This Template
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewModal.isOpen && previewModal.template && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-border-default rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border-default">
              <h2 className="text-xl font-semibold text-text-primary">
                {previewModal.template.name}
              </h2>
              <button
                onClick={() => setPreviewModal({ isOpen: false, template: null })}
                className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Preview Image */}
              {previewModal.template.previewImage && (
                <div className="relative aspect-video bg-surface-base rounded-lg overflow-hidden mb-6">
                  <Image
                    src={previewModal.template.previewImage}
                    alt={previewModal.template.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <p className="text-text-secondary mb-6">
                {previewModal.template.description}
              </p>

              {/* What's Included */}
              {previewModal.template.preview && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-text-primary">
                    What's Included
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {previewModal.template.preview.sections.length > 0 && (
                      <div className="bg-surface-base p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FileCode className="h-5 w-5 text-green-500" />
                          <span className="font-medium text-text-primary">Sections</span>
                        </div>
                        <ul className="text-sm text-text-secondary space-y-1">
                          {previewModal.template.preview.sections.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {previewModal.template.preview.templates.length > 0 && (
                      <div className="bg-surface-base p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FileJson className="h-5 w-5 text-amber-500" />
                          <span className="font-medium text-text-primary">Templates</span>
                        </div>
                        <ul className="text-sm text-text-secondary space-y-1">
                          {previewModal.template.preview.templates.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {previewModal.template.preview.assets.length > 0 && (
                      <div className="bg-surface-base p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FileCode className="h-5 w-5 text-blue-500" />
                          <span className="font-medium text-text-primary">Assets</span>
                        </div>
                        <ul className="text-sm text-text-secondary space-y-1">
                          {previewModal.template.preview.assets.map((a) => (
                            <li key={a}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {previewModal.template.preview.pages.length > 0 && (
                      <div className="bg-surface-base p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <File className="h-5 w-5 text-purple-500" />
                          <span className="font-medium text-text-primary">Pages</span>
                        </div>
                        <ul className="text-sm text-text-secondary space-y-1">
                          {previewModal.template.preview.pages.map((p) => (
                            <li key={p} className="capitalize">{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border-default flex justify-end gap-3">
              <button
                onClick={() => setPreviewModal({ isOpen: false, template: null })}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setPreviewModal({ isOpen: false, template: null });
                  openApplyModal(previewModal.template!);
                }}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Template Modal */}
      {applyModal.isOpen && applyModal.template && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-border-default rounded-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Apply Template
              </h2>
              <p className="text-text-secondary mb-6">
                Apply "{applyModal.template.name}" to your Shopify store
              </p>

              {!applyModal.applying ? (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Select Store
                    </label>
                    {loadingStores ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {stores.map((store) => (
                          <label
                            key={store._id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              applyModal.selectedStoreId === store._id
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-border-default hover:border-purple-500/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="store"
                              value={store._id}
                              checked={applyModal.selectedStoreId === store._id}
                              onChange={() =>
                                setApplyModal({ ...applyModal, selectedStoreId: store._id })
                              }
                              className="sr-only"
                            />
                            <Store className="h-5 w-5 text-text-secondary" />
                            <div className="flex-1">
                              <p className="font-medium text-text-primary">
                                {store.storeName}
                              </p>
                              <p className="text-xs text-text-secondary">
                                {store.shopDomain}
                              </p>
                            </div>
                            {store.isDefault && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                                Default
                              </span>
                            )}
                            {applyModal.selectedStoreId === store._id && (
                              <CheckCircle className="h-5 w-5 text-purple-500" />
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                    <p className="text-sm text-amber-400">
                      <strong>Note:</strong> This will add new sections and pages to your
                      active theme. Existing content will not be deleted.
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
                  <p className="text-text-secondary">{applyModal.progress}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-surface-base border-t border-border-default flex justify-end gap-3">
              <button
                onClick={() =>
                  setApplyModal({
                    isOpen: false,
                    template: null,
                    selectedStoreId: '',
                    applying: false,
                    progress: '',
                  })
                }
                disabled={applyModal.applying}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={applyTemplate}
                disabled={applyModal.applying || !applyModal.selectedStoreId}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {applyModal.applying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Apply Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Default Theme Modal */}
      {defaultThemeModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDefaultThemeModal({ isOpen: false, storeId: '', themes: [], loading: false, settingDefault: false });
            }
          }}
        >
          <div 
            className="bg-surface-raised border border-border-default rounded-xl w-full max-w-2xl relative z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                  <Home className="h-5 w-5 text-purple-500" />
                  Set Default Theme
                </h2>
                <button
                  onClick={() => setDefaultThemeModal({ isOpen: false, storeId: '', themes: [], loading: false, settingDefault: false })}
                  className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-text-secondary" />
                </button>
              </div>

              {defaultThemeModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : defaultThemeModal.themes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text-secondary">No themes found for this store.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  <div className="text-xs text-text-secondary mb-2 px-1">
                    Showing {defaultThemeModal.themes.length} theme{defaultThemeModal.themes.length !== 1 ? 's' : ''}
                  </div>
                  {defaultThemeModal.themes.map((theme: any) => {
                    const isMain = theme.role === 'main';
                    // Allow clicking even if it's the main theme - user might want to "refresh" it
                    // Only disable if we're currently setting a theme
                    const isDisabled = defaultThemeModal.settingDefault;
                    
                    console.log('Rendering theme:', { id: theme.id, name: theme.name, role: theme.role, isMain, isDisabled });
                    
                    return (
                      <div
                        key={theme.id}
                        className={`p-4 rounded-lg border flex items-center justify-between ${
                          isMain
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-border-default bg-surface-base'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-text-primary">{theme.name}</h3>
                            {isMain && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Current Default
                              </span>
                            )}
                            {theme.role === 'unpublished' && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400">
                                Unpublished
                              </span>
                            )}
                            {theme.role === 'development' && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
                                Development
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary">
                            Theme ID: {theme.id} • Created: {new Date(theme.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Button clicked:', { 
                              themeId: theme.id, 
                              role: theme.role, 
                              isMain,
                              settingDefault: defaultThemeModal.settingDefault,
                              storeId: defaultThemeModal.storeId,
                              isDisabled
                            });
                            if (!defaultThemeModal.settingDefault) {
                              console.log('Calling handleSetDefaultTheme with themeId:', theme.id);
                              handleSetDefaultTheme(Number(theme.id));
                            } else {
                              console.log('Button action blocked: setting in progress');
                            }
                          }}
                          disabled={isDisabled}
                          style={{ 
                            position: 'relative',
                            zIndex: 20
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                            isMain
                              ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                              : 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800'
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {defaultThemeModal.settingDefault ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Setting...
                            </>
                          ) : isMain ? (
                            <>
                              <Home className="h-4 w-4" />
                              Set as Default
                            </>
                          ) : (
                            <>
                              <Home className="h-4 w-4" />
                              Set as Default
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border-default">
                <button
                  onClick={() => setDefaultThemeModal({ isOpen: false, storeId: '', themes: [], loading: false, settingDefault: false })}
                  className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  Close
                </button>
                {!defaultThemeModal.loading && defaultThemeModal.themes.length > 0 && (
                  <button
                    onClick={() => {
                      if (defaultThemeModal.storeId) {
                        openDefaultThemeModal(defaultThemeModal.storeId);
                      }
                    }}
                    className="px-4 py-2 bg-surface-base border border-border-default rounded-lg hover:bg-surface-hover transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

