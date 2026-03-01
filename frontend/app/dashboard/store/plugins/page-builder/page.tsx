'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Save, Pencil, Trash2, FileText, ExternalLink, ArrowLeft, LayoutGrid, FilePlus } from 'lucide-react';
import Link from 'next/link';
import HomeSectionsEditor, { HomeSection } from './HomeSectionsEditor';

export default function PageBuilderPluginPage() {
  const { store } = useStore();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSections, setSavingSections] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ slug: '', title: '', body: '', isPublished: false, sortOrder: 0 });
  const [pluginConfigured, setPluginConfigured] = useState(false);
  const [pluginConfig, setPluginConfig] = useState<Record<string, unknown>>({});
  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);

  useEffect(() => {
    if (store?._id) {
      loadPages();
      loadPluginConfig();
    }
  }, [store?._id]);

  const loadPluginConfig = async () => {
    try {
      const res = await api.getStorePlugins(store._id);
      const p = res.data?.find((x: any) => x.slug === 'page-builder');
      const config = p?.storeConfig?.config ?? {};
      setPluginConfigured(!!p?.storeConfig?.isConfigured);
      setPluginConfig(config as Record<string, unknown>);
      const sections = Array.isArray((config as any).homeSections) ? (config as any).homeSections : [];
      setHomeSections(sections);
    } catch {}
  };

  const loadPages = async () => {
    try {
      const res = await api.getStorePages(store._id);
      if (res.success && res.data) setPages(res.data);
    } catch {
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const ensurePluginConfig = async () => {
    if (pluginConfigured) return;
    try {
      await api.updatePluginConfig(store._id, 'page-builder', { enabled: true });
      setPluginConfigured(true);
    } catch {}
  };

  const savePage = async () => {
    if (!form.title.trim()) {
      notify.error('Title is required');
      return;
    }
    const slug = form.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '') || form.title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    if (!slug) {
      notify.error('Slug is required');
      return;
    }
    setSaving(true);
    try {
      await ensurePluginConfig();
      if (editingId) {
        await api.updateStorePage(store._id, editingId, { ...form, slug });
        notify.success('Page updated');
      } else {
        await api.createStorePage(store._id, { ...form, slug });
        notify.success('Page created');
      }
      setForm({ slug: '', title: '', body: '', isPublished: false, sortOrder: 0 });
      setEditingId(null);
      loadPages();
    } catch (err: any) {
      notify.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const editPage = (p: any) => {
    setForm({
      slug: p.slug,
      title: p.title,
      body: p.body || '',
      isPublished: !!p.isPublished,
      sortOrder: p.sortOrder ?? 0,
    });
    setEditingId(p._id);
  };

  const deletePage = async (pageId: string) => {
    if (!confirm('Delete this page? This cannot be undone.')) return;
    try {
      await api.deleteStorePage(store._id, pageId);
      notify.success('Page deleted');
      if (editingId === pageId) {
        setEditingId(null);
        setForm({ slug: '', title: '', body: '', isPublished: false, sortOrder: 0 });
      }
      loadPages();
    } catch {
      notify.error('Failed to delete');
    }
  };

  const saveHomeSections = async () => {
    setSavingSections(true);
    try {
      await ensurePluginConfig();
      await api.updatePluginConfig(store._id, 'page-builder', { ...pluginConfig, enabled: true, homeSections });
      setPluginConfig((c) => ({ ...c, homeSections }));
      notify.success('Home layout saved');
    } catch (err: any) {
      notify.error(err?.response?.data?.message || 'Failed to save home layout');
    } finally {
      setSavingSections(false);
    }
  };

  const storeSlug = (store as any)?.slug ?? store?.subdomain ?? '';
  const storefrontBase = typeof window !== 'undefined' ? `${window.location.origin}/storefront/${storeSlug}` : '';

  if (!store) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard/store/plugins"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Plugins
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Page Builder & Store Design</h1>
          <p className="text-gray-400 mt-1">Custom pages and drag-and-drop home page sections</p>
        </div>
        {storeSlug && (
          <a
            href={storefrontBase}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/20 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white text-sm font-medium transition-colors shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
            View storefront
          </a>
        )}
      </div>

      {/* Home page layout card */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#1a1a2e] to-[#16162a] p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Home page layout</h2>
            <p className="text-sm text-gray-400">Drag and drop sections to build your storefront home page</p>
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-6">Add and reorder sections below. If empty, the default hero and product grid are shown.</p>
        <HomeSectionsEditor
          sections={homeSections}
          onChange={setHomeSections}
          onSave={saveHomeSections}
          saving={savingSections}
          storeId={store._id}
        />
      </section>

      {/* Custom pages */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#1a1a2e] to-[#16162a] p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Custom pages</h2>
            <p className="text-sm text-gray-400">About, FAQ, landing pages — with your own content</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : pages.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-white/15 bg-white/5 p-8 text-center">
            <FileText className="h-10 w-10 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 mb-1">No custom pages yet</p>
            <p className="text-sm text-gray-500">Create your first page using the form below.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Page</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">URL</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pages.map((p) => (
                  <tr key={p._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-white">{p.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-sm text-gray-400">/{p.slug}</code>
                    </td>
                    <td className="px-4 py-3">
                      {p.isPublished ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.isPublished && storeSlug && (
                          <a
                            href={`${storefrontBase}/pages/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Preview"
                            aria-label="Preview page"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => editPage(p)}
                          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Edit"
                          aria-label="Edit page"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePage(p._id)}
                          className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                          title="Delete"
                          aria-label="Delete page"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add / Edit page form */}
        <div className="mt-8 rounded-xl border border-white/10 bg-[#0d0d1a]/80 p-6 space-y-5">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <FilePlus className="h-4 w-4 text-violet-400" />
            {editingId ? 'Edit page' : 'Add new page'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#0d0d1a] border border-white/15 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition"
                placeholder="About Us"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">URL slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#0d0d1a] border border-white/15 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition"
                placeholder="about"
              />
              <p className="text-xs text-gray-500 mt-1">e.g. about, faq, contact</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Content (HTML allowed)</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[#0d0d1a] border border-white/15 rounded-lg text-white font-mono text-sm min-h-[140px] placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition resize-y"
              placeholder="<p>Your content here...</p>"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              className="w-4 h-4 rounded border-white/30 bg-[#0d0d1a] text-violet-500 focus:ring-violet-500/50"
            />
            <span className="text-gray-300 group-hover:text-white transition-colors">Published (visible on storefront)</span>
          </label>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={savePage}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingId ? 'Update page' : 'Create page'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ slug: '', title: '', body: '', isPublished: false, sortOrder: 0 });
                }}
                className="px-5 py-2.5 rounded-lg border border-white/20 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white font-medium text-sm transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
