'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Save, Pencil, Trash2, FileText } from 'lucide-react';
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
    if (!confirm('Delete this page?')) return;
    try {
      await api.deleteStorePage(store._id, pageId);
      notify.success('Deleted');
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

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Page Builder & Store Design</h1>
        <p className="text-gray-400 mt-1">Custom pages and drag-and-drop home page sections</p>
      </div>

      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Home page layout (drag & drop)</h2>
        <p className="text-gray-400 text-sm mb-4">Add and reorder sections for your storefront home page. If empty, the default hero + product grid is shown.</p>
        <HomeSectionsEditor
          sections={homeSections}
          onChange={setHomeSections}
          onSave={saveHomeSections}
          saving={savingSections}
        />
      </div>

      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Custom Pages</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>
        ) : (
          <ul className="space-y-2">
            {pages.length === 0 ? (
              <li className="text-gray-400">No pages yet. Add one below.</li>
            ) : (
              pages.map((p) => (
                <li key={p._id} className="flex items-center justify-between py-2 border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-white">{p.title}</span>
                    <span className="text-gray-500 text-sm">/ {p.slug}</span>
                    {!p.isPublished && <span className="text-xs text-amber-400">Draft</span>}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => editPage(p)} className="p-1.5 rounded bg-gray-600 text-white hover:bg-gray-500"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => deletePage(p._id)} className="p-1.5 rounded bg-red-600/80 text-white hover:bg-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">{editingId ? 'Edit page' : 'Add page'}</h2>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white"
            placeholder="About Us"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">URL slug (e.g. about, faq)</label>
          <input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white"
            placeholder="about"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Content (HTML allowed)</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white min-h-[120px] font-mono text-sm"
            placeholder="<p>Your content here...</p>"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} className="rounded" />
            <span className="text-white">Published (visible on storefront)</span>
          </label>
        </div>
        <div className="flex gap-3">
          <button onClick={savePage} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editingId ? 'Update' : 'Create'} page
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm({ slug: '', title: '', body: '', isPublished: false, sortOrder: 0 }); }} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500">
              Cancel
            </button>
          )}
        </div>
      </div>

      <Link href="/dashboard/store/plugins" className="inline-block text-purple-400 hover:text-purple-300 text-sm">Back to Plugins</Link>
    </div>
  );
}
