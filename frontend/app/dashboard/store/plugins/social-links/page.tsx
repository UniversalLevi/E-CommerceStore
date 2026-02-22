'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Save } from 'lucide-react';

const platformList = ['instagram', 'facebook', 'twitter', 'youtube', 'linkedin', 'tiktok'];

export default function SocialLinksPage() {
  const { store } = useStore();
  const [links, setLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (store?._id) load(); }, [store]);

  const load = async () => {
    try {
      const res = await api.getStorePlugins(store._id);
      if (res.success) {
        const p = res.data.find((x: any) => x.slug === 'social-links');
        setLinks(p?.storeConfig?.config?.links || {});
      }
    } catch { } finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.updatePluginConfig(store._id, 'social-links', { links });
      notify.success('Saved');
    } catch { notify.error('Failed'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Social Links</h1><p className="text-gray-400 mt-1">Add your social media URLs to appear in your store</p></div>
      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6 space-y-4">
        {platformList.map(pl => (
          <div key={pl}>
            <label className="text-sm text-gray-400 capitalize mb-1 block">{pl}</label>
            <input placeholder={`https://${pl}.com/your-profile`} value={links[pl] || ''} onChange={e => setLinks({ ...links, [pl]: e.target.value })} className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
          </div>
        ))}
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save
        </button>
      </div>
    </div>
  );
}
