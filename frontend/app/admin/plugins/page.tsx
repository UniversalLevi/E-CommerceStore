'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Loader2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminPluginsPage() {
  const [plugins, setPlugins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const res = await api.getPlugins(); if (res.success) setPlugins(res.data); } catch { } finally { setLoading(false); }
  };

  const toggle = async (slug: string) => {
    try {
      const res = await api.togglePlugin(slug);
      if (res.success) setPlugins(plugins.map(p => p.slug === slug ? res.data : p));
      notify.success('Updated');
    } catch { notify.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Plugin Management</h1><p className="text-gray-400 mt-1">Enable or disable plugins platform-wide</p></div>
      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-700"><th className="text-left p-4 text-gray-400">Plugin</th><th className="text-left p-4 text-gray-400">Category</th><th className="text-left p-4 text-gray-400">Status</th><th className="p-4"></th></tr></thead>
          <tbody>
            {plugins.map(p => (
              <tr key={p.slug} className="border-b border-gray-700/50">
                <td className="p-4"><span className="text-white font-medium">{p.name}</span><p className="text-xs text-gray-400 mt-0.5">{p.description}</p></td>
                <td className="p-4 text-gray-300 capitalize">{p.category}</td>
                <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${p.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="p-4"><button onClick={() => toggle(p.slug)}>{p.isActive ? <ToggleRight className="h-5 w-5 text-green-400" /> : <ToggleLeft className="h-5 w-5 text-gray-500" />}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
