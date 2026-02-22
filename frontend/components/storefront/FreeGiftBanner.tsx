'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Gift } from 'lucide-react';

interface FreeGiftBannerProps {
  slug: string;
  orderSubtotal: number;
  currency?: string;
}

export default function FreeGiftBanner({ slug, orderSubtotal, currency = 'INR' }: FreeGiftBannerProps) {
  const [rules, setRules] = useState<any[]>([]);
  const [nextRule, setNextRule] = useState<any>(null);
  const [earnedGift, setEarnedGift] = useState<any>(null);

  useEffect(() => {
    loadRules();
  }, [slug]);

  useEffect(() => {
    if (rules.length === 0) return;
    const earned = rules.filter(r => orderSubtotal >= r.minOrderValue).sort((a, b) => b.minOrderValue - a.minOrderValue)[0];
    const next = rules.filter(r => orderSubtotal < r.minOrderValue).sort((a, b) => a.minOrderValue - b.minOrderValue)[0];
    setEarnedGift(earned || null);
    setNextRule(next || null);
  }, [orderSubtotal, rules]);

  const loadRules = async () => {
    try {
      const res = await api.getEligibleFreeGifts(slug, 99999999);
      if (res.success) setRules(res.data);
    } catch { }
  };

  const fmt = (paise: number) => {
    const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
    return `${sym}${(paise / 100).toFixed(0)}`;
  };

  if (!earnedGift && !nextRule) return null;

  return (
    <div className="rounded-lg border p-3 text-sm">
      {earnedGift && (
        <div className="flex items-center gap-2 text-green-600">
          <Gift className="h-4 w-4" />
          <span>You earned a free <strong>{earnedGift.giftProductTitle}</strong>!</span>
        </div>
      )}
      {!earnedGift && nextRule && (
        <div className="flex items-center gap-2 text-orange-600">
          <Gift className="h-4 w-4" />
          <span>Add {fmt(nextRule.minOrderValue - orderSubtotal)} more to get a FREE <strong>{nextRule.giftProductTitle}</strong>!</span>
        </div>
      )}
    </div>
  );
}
