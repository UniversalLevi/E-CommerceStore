'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Gift, Loader2 } from 'lucide-react';
import { useStoreTheme } from '@/contexts/StoreThemeContext';

export default function GiftCardsStorefrontPage() {
  const { slug } = useParams() as { slug: string };
  const { colors } = useStoreTheme();
  const [form, setForm] = useState({ amount: 500, purchaserEmail: '', recipientEmail: '', recipientName: '', message: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkCode, setCheckCode] = useState('');
  const [balance, setBalance] = useState<any>(null);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.purchaseGiftCard(slug, { ...form, amount: form.amount * 100 });
      if (res.success) { setResult(res.data); notify.success('Gift card purchased!'); }
    } catch (err: any) { notify.error(err.response?.data?.message || 'Failed'); } finally { setLoading(false); }
  };

  const handleCheckBalance = async () => {
    try {
      const res = await api.checkGiftCardBalance(slug, checkCode);
      if (res.success) setBalance(res.data);
    } catch (err: any) { notify.error(err.response?.data?.message || 'Gift card not found'); setBalance(null); }
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: colors.background }}>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <Gift className="h-12 w-12 mx-auto mb-3" style={{ color: colors.accent }} />
          <h1 className="text-3xl font-bold" style={{ color: colors.text }}>Gift Cards</h1>
          <p className="mt-2" style={{ color: colors.text + '99' }}>Give the gift of choice</p>
        </div>

        <div className="rounded-xl p-6 border" style={{ backgroundColor: colors.secondary, borderColor: colors.primary + '20' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Purchase a Gift Card</h2>
          <form onSubmit={handlePurchase} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input required type="number" placeholder="Amount" value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="px-4 py-2 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.primary + '30', color: colors.text }} />
              <input required type="email" placeholder="Your email" value={form.purchaserEmail} onChange={e => setForm({ ...form, purchaserEmail: e.target.value })} className="px-4 py-2 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.primary + '30', color: colors.text }} />
              <input type="email" placeholder="Recipient email" value={form.recipientEmail} onChange={e => setForm({ ...form, recipientEmail: e.target.value })} className="px-4 py-2 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.primary + '30', color: colors.text }} />
              <input placeholder="Recipient name" value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })} className="px-4 py-2 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.primary + '30', color: colors.text }} />
            </div>
            <textarea placeholder="Personal message (optional)" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={2} className="w-full px-4 py-2 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.primary + '30', color: colors.text }} />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-medium text-white disabled:opacity-50" style={{ backgroundColor: colors.accent }}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Purchase Gift Card'}
            </button>
          </form>
          {result && (
            <div className="mt-4 p-4 rounded-lg text-center" style={{ backgroundColor: colors.accent + '15' }}>
              <p className="text-sm" style={{ color: colors.text }}>Your gift card code:</p>
              <p className="text-2xl font-mono font-bold mt-1" style={{ color: colors.accent }}>{result.code}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl p-6 border" style={{ backgroundColor: colors.secondary, borderColor: colors.primary + '20' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Check Balance</h2>
          <div className="flex gap-2">
            <input placeholder="Enter gift card code" value={checkCode} onChange={e => setCheckCode(e.target.value)} className="flex-1 px-4 py-2 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.primary + '30', color: colors.text }} />
            <button onClick={handleCheckBalance} className="px-6 py-2 rounded-lg font-medium text-white" style={{ backgroundColor: colors.accent }}>Check</button>
          </div>
          {balance && (
            <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: colors.accent + '15' }}>
              <p style={{ color: colors.text }}>Balance: <strong style={{ color: colors.accent }}>{balance.currency === 'USD' ? '$' : '₹'}{(balance.balance / 100).toFixed(2)}</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
