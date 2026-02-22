'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Save } from 'lucide-react';

export default function PartialCodPage() {
  const { store } = useStore();
  const [config, setConfig] = useState({ enabled: false, type: 'percentage' as 'fixed' | 'percentage', value: 20 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (store?._id) load(); }, [store]);

  const load = async () => {
    try {
      const res = await api.getMyStore();
      if (res.success && res.data?.settings?.partialCod) {
        setConfig({ ...config, ...res.data.settings.partialCod });
      }
    } catch { } finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.updateStore(store._id, { settings: { ...store.settings, partialCod: config } });
      notify.success('Saved');
    } catch { notify.error('Failed'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Partial Cash on Delivery</h1><p className="text-gray-400 mt-1">Let customers pay part online and the rest on delivery</p></div>
      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6 space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} className="w-4 h-4 rounded" />
          <span className="text-white">Enable Partial COD</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Prepaid Type</label>
            <select value={config.type} onChange={e => setConfig({ ...config, type: e.target.value as any })} className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white">
              <option value="percentage">Percentage of total</option>
              <option value="fixed">Fixed amount (in paise)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">{config.type === 'percentage' ? 'Percentage (1-99)' : 'Fixed amount (paise)'}</label>
            <input type="number" value={config.value} onChange={e => setConfig({ ...config, value: Number(e.target.value) })} className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          {config.type === 'percentage'
            ? `Customer pays ${config.value}% online, rest on delivery.`
            : `Customer pays ₹${(config.value / 100).toFixed(0)} online, rest on delivery.`
          }
        </p>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save
        </button>
      </div>
    </div>
  );
}
