'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function FreeGiftsPage() {
  const { store } = useStore();
  const [rules, setRules] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ minOrderValue: 0, giftProductId: '', maxClaims: 0 });

  useEffect(() => { if (store?._id) load(); }, [store]);

  const load = async () => {
    try {
      const [rulesRes, prodsRes] = await Promise.all([
        api.listFreeGiftRules(store._id),
        api.getStoreProducts(store._id),
      ]);
      if (rulesRes.success) setRules(rulesRes.data);
      if (prodsRes.success) setProducts(Array.isArray(prodsRes.data) ? prodsRes.data : (prodsRes.data?.products ?? []));
    } catch { } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createFreeGiftRule(store._id, { ...form, minOrderValue: form.minOrderValue * 100 });
      if (res.success) { notify.success('Free gift rule created'); setRules([...rules, res.data]); setShowForm(false); }
    } catch (err: any) { notify.error(err.response?.data?.message || 'Failed'); }
  };

  const handleToggle = async (rule: any) => {
    try {
      const res = await api.updateFreeGiftRule(store._id, rule._id, { isActive: !rule.isActive });
      if (res.success) setRules(rules.map(r => r._id === rule._id ? res.data : r));
    } catch { notify.error('Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try { await api.deleteFreeGiftRule(store._id, id); setRules(rules.filter(r => r._id !== id)); notify.success('Deleted'); } catch { notify.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Free Gift Rules</h1><p className="text-gray-400 mt-1">Offer free products when order value reaches a threshold</p></div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><Plus className="h-4 w-4" />New Rule</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input required type="number" placeholder="Min order value (currency)" value={form.minOrderValue || ''} onChange={e => setForm({ ...form, minOrderValue: Number(e.target.value) })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
            <select required value={form.giftProductId} onChange={e => setForm({ ...form, giftProductId: e.target.value })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white">
              <option value="">Select gift product</option>
              {(Array.isArray(products) ? products : []).map((p: any) => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
            <input type="number" placeholder="Max claims (0=unlimited)" value={form.maxClaims || ''} onChange={e => setForm({ ...form, maxClaims: Number(e.target.value) })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
          </div>
          <div className="flex gap-3"><button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Create</button><button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-700 text-white rounded-lg">Cancel</button></div>
        </form>
      )}

      <div className="space-y-3">
        {rules.map(rule => (
          <div key={rule._id} className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-white font-medium">Order above ₹{(rule.minOrderValue / 100).toFixed(0)} → Free {rule.giftProductTitle}</p>
              <p className="text-xs text-gray-400 mt-1">Claimed: {rule.claimedCount}{rule.maxClaims > 0 ? `/${rule.maxClaims}` : ''}</p>
            </div>
            <button onClick={() => handleToggle(rule)}>{rule.isActive ? <ToggleRight className="h-5 w-5 text-green-400" /> : <ToggleLeft className="h-5 w-5 text-gray-500" />}</button>
            <button onClick={() => handleDelete(rule._id)} className="text-red-400"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {rules.length === 0 && <div className="text-center text-gray-500 py-8">No free gift rules yet</div>}
      </div>
    </div>
  );
}
