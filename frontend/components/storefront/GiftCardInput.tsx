'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, Gift, X } from 'lucide-react';

interface GiftCardInputProps {
  slug: string;
  onApply: (code: string, balance: number) => void;
  onRemove: () => void;
  appliedCode?: string;
  appliedAmount?: number;
  formatPrice: (paise: number) => string;
}

export default function GiftCardInput({ slug, onApply, onRemove, appliedCode, appliedAmount, formatPrice }: GiftCardInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.checkGiftCardBalance(slug, code.trim());
      if (res.success && res.data && res.data.balance > 0) {
        onApply(res.data.code, res.data.balance);
        setCode('');
      } else {
        setError('No balance on this gift card');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gift card not found');
    } finally {
      setLoading(false);
    }
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-pink-500" />
          <span className="text-sm font-medium text-pink-400">{appliedCode}</span>
          <span className="text-sm text-pink-400">(-{formatPrice(appliedAmount || 0)})</span>
        </div>
        <button onClick={onRemove} className="text-pink-400 hover:text-pink-300"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          placeholder="Enter gift card code"
          value={code}
          onChange={e => { setCode(e.target.value); setError(''); }}
          className="flex-1 px-3 py-2 text-sm bg-surface-raised border border-border-default rounded-lg text-text-primary"
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="px-4 py-2 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
