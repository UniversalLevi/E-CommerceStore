'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, Tag, X } from 'lucide-react';

interface CouponInputProps {
  slug: string;
  orderSubtotal: number;
  onApply: (code: string, discount: number) => void;
  onRemove: () => void;
  appliedCode?: string;
  appliedDiscount?: number;
  formatPrice: (paise: number) => string;
}

export default function CouponInput({ slug, orderSubtotal, onApply, onRemove, appliedCode, appliedDiscount, formatPrice }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.validateCoupon(slug, code.trim(), orderSubtotal);
      if (res.success && res.data) {
        onApply(res.data.code, res.data.discount);
        setCode('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid coupon');
    } finally {
      setLoading(false);
    }
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-green-400">{appliedCode}</span>
          <span className="text-sm text-green-400">(-{formatPrice(appliedDiscount || 0)})</span>
        </div>
        <button onClick={onRemove} className="text-green-400 hover:text-green-300"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          placeholder="Enter coupon code"
          value={code}
          onChange={e => { setCode(e.target.value); setError(''); }}
          className="flex-1 px-3 py-2 text-sm bg-surface-raised border border-border-default rounded-lg text-text-primary"
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
