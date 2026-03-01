'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Save, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function UpsellPluginPage() {
  const { store } = useStore();
  const [config, setConfig] = useState({
    enabled: true,
    showBoughtTogether: true,
    defaultBundleDiscountPercent: 10,
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
        const p = res.data.find((x: any) => x.slug === 'upsell-conversion');
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
      await api.updatePluginConfig(store._id, 'upsell-conversion', config);
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
        <h1 className="text-2xl font-bold text-white">Upsell & Conversion Boost</h1>
        <p className="text-gray-400 mt-1">Frequently bought together, product recommendations, and bundle discounts</p>
      </div>

      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6 space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-white">Enable upsell & recommendations on storefront</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.showBoughtTogether}
            onChange={(e) => setConfig({ ...config, showBoughtTogether: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-white">Show “Frequently bought together” block on product page</span>
        </label>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Default bundle discount (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={config.defaultBundleDiscountPercent ?? 10}
            onChange={(e) => setConfig({ ...config, defaultBundleDiscountPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
            className="w-24 px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white"
          />
          <p className="text-xs text-gray-500 mt-1">Used when you add “Frequently bought together” products to a product (edit product to set which items are bought together).</p>
        </div>
        <div className="pt-2 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-2">To set “Frequently bought together” for a product:</p>
          <Link href="/dashboard/store/products" className="text-purple-400 hover:text-purple-300 text-sm underline">
            Go to My Products
          </Link>
          <span className="text-gray-500 text-sm"> → Edit a product and add related products for the bundle.</span>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>

      <Link href="/dashboard/store/plugins" className="inline-block text-purple-400 hover:text-purple-300 text-sm">Back to Plugins</Link>
    </div>
  );
}
