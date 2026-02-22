'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Save } from 'lucide-react';

export default function CountdownPage() {
  const { store } = useStore();
  const [config, setConfig] = useState({ endDate: '', label: 'Offer ends in', enabled: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (store?._id) load(); }, [store]);

  const load = async () => {
    try {
      const res = await api.getStorePlugins(store._id);
      if (res.success) {
        const p = res.data.find((x: any) => x.slug === 'countdown-timer');
        if (p?.storeConfig?.config) setConfig({ ...config, ...p.storeConfig.config });
      }
    } catch { } finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try { await api.updatePluginConfig(store._id, 'countdown-timer', config); notify.success('Saved'); } catch { notify.error('Failed'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Countdown Timer</h1><p className="text-gray-400 mt-1">Add countdown timers to create urgency for limited-time offers</p></div>
      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6 space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} className="w-4 h-4 rounded" />
          <span className="text-white">Enable store-wide countdown</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-sm text-gray-400 mb-1 block">Countdown End Date</label><input type="datetime-local" value={config.endDate} onChange={e => setConfig({ ...config, endDate: e.target.value })} className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" /></div>
          <div><label className="text-sm text-gray-400 mb-1 block">Label</label><input value={config.label} onChange={e => setConfig({ ...config, label: e.target.value })} className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" /></div>
        </div>
        <p className="text-xs text-gray-500">You can also set per-product countdowns when editing individual products.</p>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save
        </button>
      </div>
    </div>
  );
}
