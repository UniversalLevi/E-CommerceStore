'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/contexts/StoreContext';
import { notify } from '@/lib/toast';
import { Loader2, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function BundlesPage() {
  const { store } = useStore();
  const [bundles, setBundles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', bundlePrice: 0, selectedProducts: [] as { productId: string; quantity: number }[] });

  useEffect(() => { if (store?._id) load(); }, [store]);

  const load = async () => {
    try {
      const [bRes, pRes] = await Promise.all([api.listBundles(store._id), api.getStoreProducts(store._id)]);
      if (bRes.success) setBundles(bRes.data);
      if (pRes.success) setProducts(Array.isArray(pRes.data) ? pRes.data : (pRes.data?.products ?? []));
    } catch { } finally { setLoading(false); }
  };

  const addProduct = () => setForm({ ...form, selectedProducts: [...form.selectedProducts, { productId: '', quantity: 1 }] });
  const removeProduct = (i: number) => setForm({ ...form, selectedProducts: form.selectedProducts.filter((_, idx) => idx !== i) });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.selectedProducts.length < 2) { notify.error('At least 2 products required'); return; }
    try {
      const res = await api.createBundle(store._id, { title: form.title, description: form.description, bundlePrice: form.bundlePrice * 100, products: form.selectedProducts });
      if (res.success) { notify.success('Bundle created'); setBundles([...bundles, res.data]); setShowForm(false); }
    } catch (err: any) { notify.error(err.response?.data?.message || 'Failed'); }
  };

  const handleToggle = async (b: any) => {
    try {
      const res = await api.updateBundle(store._id, b._id, { isActive: !b.isActive });
      if (res.success) setBundles(bundles.map(x => x._id === b._id ? res.data : x));
    } catch { notify.error('Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bundle?')) return;
    try { await api.deleteBundle(store._id, id); setBundles(bundles.filter(b => b._id !== id)); notify.success('Deleted'); } catch { notify.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Product Bundles</h1><p className="text-gray-400 mt-1">Create product bundles at discounted prices</p></div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><Plus className="h-4 w-4" />New Bundle</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Bundle title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
            <input required type="number" placeholder="Bundle price (currency)" value={form.bundlePrice || ''} onChange={e => setForm({ ...form, bundlePrice: Number(e.target.value) })} className="px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
          </div>
          <input placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Products in bundle</label>
            {form.selectedProducts.map((sp, i) => (
              <div key={i} className="flex gap-2">
                <select value={sp.productId} onChange={e => { const copy = [...form.selectedProducts]; copy[i].productId = e.target.value; setForm({ ...form, selectedProducts: copy }); }} className="flex-1 px-4 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white">
                  <option value="">Select product</option>
                  {(Array.isArray(products) ? products : []).map((p: any) => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
                <input type="number" min={1} value={sp.quantity} onChange={e => { const copy = [...form.selectedProducts]; copy[i].quantity = Number(e.target.value); setForm({ ...form, selectedProducts: copy }); }} className="w-20 px-3 py-2 bg-[#0d0d1a] border border-gray-600 rounded-lg text-white" />
                <button type="button" onClick={() => removeProduct(i)} className="text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" onClick={addProduct} className="text-sm text-purple-400 hover:text-purple-300">+ Add product</button>
          </div>
          <div className="flex gap-3"><button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Create</button><button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-700 text-white rounded-lg">Cancel</button></div>
        </form>
      )}

      <div className="space-y-3">
        {bundles.map(b => (
          <div key={b._id} className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-white font-medium">{b.title}</p>
              <p className="text-xs text-gray-400 mt-1">Original: ₹{(b.originalPrice / 100).toFixed(0)} → Bundle: ₹{(b.bundlePrice / 100).toFixed(0)} ({b.products?.length || 0} products)</p>
            </div>
            <button onClick={() => handleToggle(b)}>{b.isActive ? <ToggleRight className="h-5 w-5 text-green-400" /> : <ToggleLeft className="h-5 w-5 text-gray-500" />}</button>
            <button onClick={() => handleDelete(b._id)} className="text-red-400"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {bundles.length === 0 && <div className="text-center text-gray-500 py-8">No bundles yet</div>}
      </div>
    </div>
  );
}
