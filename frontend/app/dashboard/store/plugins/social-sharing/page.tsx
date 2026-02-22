'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Save } from 'lucide-react';

const platforms = ['whatsapp', 'facebook', 'twitter', 'copy_link'];

export default function SocialSharingPage() {
  const { store } = useStore();
  const [config, setConfig] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (store?._id) load(); }, [store]);

  const load = async () => {
    try {
      const res = await api.getStorePlugins(store._id);
      if (res.success) {
        const p = res.data.find((x: any) => x.slug === 'social-sharing');
        const existing = p?.storeConfig?.config?.platforms || {};
        const cfg: Record<string, boolean> = {};
        platforms.forEach(pl => { cfg[pl] = existing[pl] !== false; });
        setConfig(cfg);
      }
    } catch { } finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.updatePluginConfig(store._id, 'social-sharing', { platforms: config });
      notify.success('Saved');
    } catch { notify.error('Failed'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Social Sharing</h1><p className="text-gray-400 mt-1">Choose which share buttons appear on product pages</p></div>
      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6 space-y-4">
        {platforms.map(pl => (
          <label key={pl} className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={config[pl] ?? true} onChange={e => setConfig({ ...config, [pl]: e.target.checked })} className="w-4 h-4 rounded" />
            <span className="text-white capitalize">{pl.replace('_', ' ')}</span>
          </label>
        ))}
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save
        </button>
      </div>
    </div>
  );
}
