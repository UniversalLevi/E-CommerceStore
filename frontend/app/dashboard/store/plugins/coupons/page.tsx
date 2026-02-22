'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function CouponsPage() {
  const { store } = useStore();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'percentage' as 'percentage' | 'fixed', value: 0, minOrderValue: 0, maxDiscount: 0, usageLimit: 0, expiresAt: '' });

  useEffect(() => { if (store?._id) fetch(); }, [store]);

  const fetch = async () => {
    try {
      const res = await api.listCoupons(store._id);
      if (res.success) setCoupons(res.data);
    } catch { } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, value: form.type === 'fixed' ? form.value * 100 : form.value, minOrderValue: form.minOrderValue * 100, maxDiscount: form.maxDiscount * 100, expiresAt: form.expiresAt || undefined };
      const res = await api.createCoupon(store._id, payload);
      if (res.success) { notify.success('Coupon created'); setCoupons([res.data, ...coupons]); setShowForm(false); setForm({ code: '', type: 'percentage', value: 0, minOrderValue: 0, maxDiscount: 0, usageLimit: 0, expiresAt: '' }); }
    } catch (err: any) { notify.error(err.response?.data?.message || 'Failed'); }
  };

  const handleToggle = async (c: any) => {
    try {
      const res = await api.updateCoupon(store._id, c._id, { isActive: !c.isActive });
      if (res.success) setCoupons(coupons.map(x => x._id === c._id ? res.data : x));
    } catch { notify.error('Failed to update'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.deleteCoupon(store._id, id);
      setCoupons(coupons.filter(x => x._id !== id));
      notify.success('Deleted');
    } catch { notify.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Discount Coupons</h1><p className="text-gray-400 mt-1">Create and manage discount codes for your store</p></div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><Plus className="h-4 w-4" />New Coupon</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Coupon Code (e.g. SAVE20)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount</option>
            </select>
            <input required type="number" placeholder={form.type === 'percentage' ? 'Discount %' : 'Amount (in currency)'} value={form.value || ''} onChange={e => setForm({ ...form, value: Number(e.target.value) })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
            <input type="number" placeholder="Min order value (in currency)" value={form.minOrderValue || ''} onChange={e => setForm({ ...form, minOrderValue: Number(e.target.value) })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
            <input type="number" placeholder="Max discount (in currency, 0=none)" value={form.maxDiscount || ''} onChange={e => setForm({ ...form, maxDiscount: Number(e.target.value) })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
            <input type="number" placeholder="Usage limit (0=unlimited)" value={form.usageLimit || ''} onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
            <input type="datetime-local" placeholder="Expires at" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
          </div>
          <div className="flex gap-3"><button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Create</button><button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">Cancel</button></div>
        </form>
      )}

      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-700"><th className="text-left p-4 text-gray-400">Code</th><th className="text-left p-4 text-gray-400">Type</th><th className="text-left p-4 text-gray-400">Value</th><th className="text-left p-4 text-gray-400">Used</th><th className="text-left p-4 text-gray-400">Status</th><th className="p-4"></th></tr></thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c._id} className="border-b border-gray-700/50">
                <td className="p-4 text-white font-mono">{c.code}</td>
                <td className="p-4 text-gray-300">{c.type}</td>
                <td className="p-4 text-gray-300">{c.type === 'percentage' ? `${c.value}%` : `${(c.value / 100).toFixed(2)}`}</td>
                <td className="p-4 text-gray-300">{c.usedCount}{c.usageLimit > 0 ? `/${c.usageLimit}` : ''}</td>
                <td className="p-4"><button onClick={() => handleToggle(c)}>{c.isActive ? <ToggleRight className="h-5 w-5 text-green-400" /> : <ToggleLeft className="h-5 w-5 text-gray-500" />}</button></td>
                <td className="p-4"><button onClick={() => handleDelete(c._id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
            {coupons.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-500">No coupons yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
