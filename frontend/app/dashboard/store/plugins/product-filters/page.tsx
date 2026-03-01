'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Save } from 'lucide-react';
import Link from 'next/link';

export default function ProductFiltersPluginPage() {
  const { store } = useStore();
  const [config, setConfig] = useState({
    enabled: true,
    showPriceFilter: true,
    showTagFilter: true,
    showVariantFilter: true,
    defaultSort: 'newest',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store?._id) load();
  }, [store]);

  const load = async () => {
    try {
      const res = await api.getStorePlugins(store._id);
      if (res.success) {
        const p = res.data.find((x: any) => x.slug === 'product-filters');
        if (p?.storeConfig?.config) setConfig((c) => ({ ...c, ...p.storeConfig.config }));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.updatePluginConfig(store._id, 'product-filters', config);
      notify.success('Saved');
    } catch {
      notify.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Product Filtering and Search</h1>
        <p className="text-gray-400 mt-1">Enable filters by tag, variant, and price on your store product listing</p>
      </div>
      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6 space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-white">Enable product filters on storefront</span>
        </label>
        <div className="space-y-3 pt-2 border-t border-gray-700">
          <p className="text-sm text-gray-400">Show on storefront</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showPriceFilter}
              onChange={(e) => setConfig({ ...config, showPriceFilter: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="text-white">Price range (min / max)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showTagFilter}
              onChange={(e) => setConfig({ ...config, showTagFilter: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="text-white">Tags (from product metadata)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showVariantFilter}
              onChange={(e) => setConfig({ ...config, showVariantFilter: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="text-white">Variant dimension</span>
          </label>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Default sort</label>
          <select
            value={config.defaultSort}
            onChange={(e) => setConfig({ ...config, defaultSort: e.target.value })}
            className="w-full max-w-xs px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
        <p className="text-xs text-gray-500">Add tags to products in product edit (metadata) and set variant dimension to use tag and variant filters.</p>
        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
          <Link
            href="/dashboard/store/plugins"
            className="px-6 py-2 bg-[#2a2a4e] text-white rounded-lg hover:bg-[#3a3a5e]"
          >
            Back to Plugins
          </Link>
        </div>
      </div>
    </div>
  );
}
