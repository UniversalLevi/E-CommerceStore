'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Save, Users } from 'lucide-react';

export default function PopupsPage() {
  const { store } = useStore();
  const [config, setConfig] = useState({ title: 'Get 10% Off!', description: 'Subscribe to our newsletter and get an exclusive discount.', couponCode: '', triggerType: 'delay', triggerValue: 5000, bgColor: '#1a1a2e' });
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSubs, setShowSubs] = useState(false);

  useEffect(() => { if (store?._id) load(); }, [store]);

  const load = async () => {
    try {
      const [pluginRes, subsRes] = await Promise.all([api.getStorePlugins(store._id), api.listSubscribers(store._id)]);
      if (pluginRes.success) {
        const p = pluginRes.data.find((x: any) => x.slug === 'email-popup');
        if (p?.storeConfig?.config) setConfig({ ...config, ...p.storeConfig.config });
      }
      if (subsRes.success) setSubscribers(subsRes.data);
    } catch { } finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try { await api.updatePluginConfig(store._id, 'email-popup', config); notify.success('Saved'); } catch { notify.error('Failed'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Email Collection Popup</h1><p className="text-gray-400 mt-1">Collect emails and optionally offer discount codes</p></div>
        <button onClick={() => setShowSubs(!showSubs)} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"><Users className="h-4 w-4" />{subscribers.length} Subscribers</button>
      </div>

      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-sm text-gray-400 mb-1 block">Popup Title</label><input value={config.title} onChange={e => setConfig({ ...config, title: e.target.value })} className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" /></div>
          <div><label className="text-sm text-gray-400 mb-1 block">Coupon Code (optional)</label><input placeholder="e.g. WELCOME10" value={config.couponCode} onChange={e => setConfig({ ...config, couponCode: e.target.value })} className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" /></div>
        </div>
        <div><label className="text-sm text-gray-400 mb-1 block">Description</label><textarea value={config.description} onChange={e => setConfig({ ...config, description: e.target.value })} rows={2} className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Trigger</label>
            <select value={config.triggerType} onChange={e => setConfig({ ...config, triggerType: e.target.value })} className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white">
              <option value="delay">Time Delay</option>
              <option value="exit_intent">Exit Intent</option>
              <option value="scroll">Scroll Percentage</option>
            </select>
          </div>
          <div><label className="text-sm text-gray-400 mb-1 block">{config.triggerType === 'delay' ? 'Delay (ms)' : config.triggerType === 'scroll' ? 'Scroll %' : 'N/A'}</label><input type="number" value={config.triggerValue} onChange={e => setConfig({ ...config, triggerValue: Number(e.target.value) })} className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" /></div>
          <div className="flex items-end gap-2"><label className="text-sm text-gray-400 mb-1 block">BG Color</label><input type="color" value={config.bgColor} onChange={e => setConfig({ ...config, bgColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" /></div>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save
        </button>
      </div>

      {showSubs && (
        <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-white font-medium">Subscribers ({subscribers.length})</h3>
            <a href={`/api/store-dashboard/stores/${store._id}/subscribers/export`} className="text-sm text-purple-400 hover:text-purple-300">Export CSV</a>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {subscribers.map(s => (
              <div key={s._id} className="px-4 py-2 border-b border-gray-700/50 flex justify-between text-sm">
                <span className="text-white">{s.email}</span>
                <span className="text-gray-400">{new Date(s.subscribedAt).toLocaleDateString()}</span>
              </div>
            ))}
            {subscribers.length === 0 && <div className="p-4 text-center text-gray-500">No subscribers yet</div>}
          </div>
        </div>
      )}
    </div>
  );
}
