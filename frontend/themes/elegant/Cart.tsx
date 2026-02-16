'use client';

import { getImageUrl } from '@/lib/imageUrl';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { useCartStore } from '@/store/useCartStore';
import { Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../elegant/styles.css';

interface CartProps {
  storeSlug: string;
  currency: string;
}

export default function Cart({ storeSlug, currency }: CartProps) {
  const { colors } = useStoreTheme();
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  const router = useRouter();

  const formatPrice = (price: number) => {
    const currencySymbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${(price / 100).toFixed(2)}`;
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center elegant-fade-in">
        <h1 className="text-4xl font-bold mb-4" style={{ color: colors.primary }}>
          Your Cart
        </h1>
        <p className="text-lg mb-8" style={{ color: colors.text + 'CC' }}>
          Your cart is empty
        </p>
        <Link
          href={`/storefront/${storeSlug}`}
          className="inline-block px-8 py-4 rounded-lg font-bold text-white elegant-button transition-all"
          style={{ 
            backgroundColor: colors.accent,
            color: colors.primary,
            boxShadow: `0 8px 25px ${colors.accent}30`,
          }}
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 elegant-fade-in">
      <h1 className="text-4xl font-bold mb-8" style={{ color: colors.primary }}>
        Your Cart
      </h1>

      <div className="space-y-4 mb-8">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-6 rounded-lg border elegant-card"
            style={{
              backgroundColor: colors.secondary + '30',
              borderColor: colors.border || colors.accent + '20',
            }}
          >
            {item.image && (
              <img
                src={getImageUrl(item.image)}
                alt={item.title}
                className="w-24 h-24 object-cover rounded-lg border-2"
                style={{ borderColor: colors.accent + '30' }}
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold mb-1 text-lg" style={{ color: colors.text }}>
                {item.title}
              </h3>
              {item.variant && (
                <p className="text-sm mb-1" style={{ color: colors.text + 'CC' }}>
                  Variant: {item.variant}
                </p>
              )}
              <p className="font-bold text-lg" style={{ color: colors.accent }}>
                {formatPrice(item.price || 0)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateQuantity(item.productId, item.variant, item.quantity - 1)}
                className="p-2 rounded elegant-button border"
                style={{ 
                  color: colors.accent,
                  borderColor: colors.accent + '30',
                }}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-lg font-medium" style={{ color: colors.text }}>
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.productId, item.variant, item.quantity + 1)}
                className="p-2 rounded elegant-button border"
                style={{ 
                  color: colors.accent,
                  borderColor: colors.accent + '30',
                }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => removeItem(item.productId, item.variant)}
              className="p-2 rounded-lg elegant-hover transition-all"
              style={{ color: colors.accent }}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t pt-6" style={{ borderColor: colors.border || colors.accent + '30' }}>
        <div className="flex justify-between items-center mb-6">
          <span className="text-2xl font-semibold" style={{ color: colors.text }}>
            Total:
          </span>
          <span className="text-3xl font-bold" style={{ color: colors.accent }}>
            {formatPrice(getTotalPrice())}
          </span>
        </div>
        <button
          onClick={() => router.push(`/storefront/${storeSlug}/checkout`)}
          className="w-full px-8 py-4 rounded-lg font-bold text-white elegant-button transition-all"
          style={{ 
            backgroundColor: colors.accent,
            color: colors.primary,
            boxShadow: `0 8px 25px ${colors.accent}30`,
          }}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
