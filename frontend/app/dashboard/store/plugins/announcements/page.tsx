'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';

interface Announcement { text: string; link?: string; bgColor?: string; textColor?: string; }

export default function AnnouncementsPage() {
  const { store } = useStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [speed, setSpeed] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (store?._id) load(); }, [store]);

  const load = async () => {
    try {
      const res = await api.getStorePlugins(store._id);
      if (res.success) {
        const p = res.data.find((x: any) => x.slug === 'announcement-bar');
        const cfg = p?.storeConfig?.config || {};
        setAnnouncements(cfg.announcements || []);
        setSpeed(cfg.speed || 30);
      }
    } catch { } finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.updatePluginConfig(store._id, 'announcement-bar', { announcements, speed });
      notify.success('Saved');
    } catch { notify.error('Failed'); } finally { setSaving(false); }
  };

  const addAnnouncement = () => setAnnouncements([...announcements, { text: '', bgColor: '#7c3aed', textColor: '#ffffff' }]);
  const removeAnnouncement = (i: number) => setAnnouncements(announcements.filter((_, idx) => idx !== i));
  const update = (i: number, field: string, val: string) => {
    const copy = [...announcements];
    (copy[i] as any)[field] = val;
    setAnnouncements(copy);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Announcement Bar</h1><p className="text-gray-400 mt-1">Show a scrolling bar at the top of your store</p></div>
        <button onClick={addAnnouncement} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><Plus className="h-4 w-4" />Add</button>
      </div>

      <div className="space-y-3">
        {announcements.map((a, i) => (
          <div key={i} className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              <input placeholder="Announcement text" value={a.text} onChange={e => update(i, 'text', e.target.value)} className="flex-1 px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
              <button onClick={() => removeAnnouncement(i)} className="text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input placeholder="Link (optional)" value={a.link || ''} onChange={e => update(i, 'link', e.target.value)} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
              <div className="flex items-center gap-2"><label className="text-xs text-gray-400">BG</label><input type="color" value={a.bgColor || '#7c3aed'} onChange={e => update(i, 'bgColor', e.target.value)} className="w-10 h-8 rounded cursor-pointer" /></div>
              <div className="flex items-center gap-2"><label className="text-xs text-gray-400">Text</label><input type="color" value={a.textColor || '#ffffff'} onChange={e => update(i, 'textColor', e.target.value)} className="w-10 h-8 rounded cursor-pointer" /></div>
            </div>
          </div>
        ))}
        {announcements.length === 0 && <div className="text-center text-gray-500 py-8">No announcements yet</div>}
      </div>

      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-4">
        <label className="text-sm text-gray-400 mb-2 block">Scroll speed (seconds per cycle)</label>
        <input type="number" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-32 px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
      </div>

      <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save
      </button>
    </div>
  );
}
