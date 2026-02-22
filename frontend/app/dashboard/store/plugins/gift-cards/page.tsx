'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function GiftCardsPage() {
  const { store } = useStore();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ initialBalance: 0, recipientEmail: '', recipientName: '', message: '' });

  useEffect(() => { if (store?._id) load(); }, [store]);

  const load = async () => {
    try { const res = await api.listGiftCards(store._id); if (res.success) setCards(res.data); } catch { } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createGiftCard(store._id, { ...form, initialBalance: form.initialBalance * 100 });
      if (res.success) { notify.success('Gift card created'); setCards([res.data, ...cards]); setShowForm(false); }
    } catch (err: any) { notify.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gift card?')) return;
    try { await api.deleteGiftCard(store._id, id); setCards(cards.filter(x => x._id !== id)); notify.success('Deleted'); } catch { notify.error('Failed'); }
  };

  const fmt = (paise: number) => `${store?.currency === 'USD' ? '$' : store?.currency === 'EUR' ? '€' : '₹'}${(paise / 100).toFixed(2)}`;

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Gift Cards</h1><p className="text-gray-400 mt-1">Create and manage gift cards</p></div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><Plus className="h-4 w-4" />Create Gift Card</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required type="number" placeholder="Balance (in currency units)" value={form.initialBalance || ''} onChange={e => setForm({ ...form, initialBalance: Number(e.target.value) })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
            <input type="email" placeholder="Recipient Email" value={form.recipientEmail} onChange={e => setForm({ ...form, recipientEmail: e.target.value })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
            <input placeholder="Recipient Name" value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
            <input placeholder="Message (optional)" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
          </div>
          <div className="flex gap-3"><button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Create</button><button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-700 text-white rounded-lg">Cancel</button></div>
        </form>
      )}

      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-700"><th className="text-left p-4 text-gray-400">Code</th><th className="text-left p-4 text-gray-400">Balance</th><th className="text-left p-4 text-gray-400">Initial</th><th className="text-left p-4 text-gray-400">Recipient</th><th className="text-left p-4 text-gray-400">Status</th><th className="p-4"></th></tr></thead>
          <tbody>
            {cards.map(gc => (
              <tr key={gc._id} className="border-b border-gray-700/50">
                <td className="p-4 text-white font-mono">{gc.code}</td>
                <td className="p-4 text-gray-300">{fmt(gc.currentBalance)}</td>
                <td className="p-4 text-gray-300">{fmt(gc.initialBalance)}</td>
                <td className="p-4 text-gray-300">{gc.recipientEmail || '-'}</td>
                <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${gc.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{gc.isActive ? 'Active' : 'Used'}</span></td>
                <td className="p-4"><button onClick={() => handleDelete(gc._id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
            {cards.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-500">No gift cards yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
