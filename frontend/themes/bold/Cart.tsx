'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { useCartStore } from '@/store/useCartStore';
import { Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../bold/styles.css';

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center slide-in-bold">
        <h1 className="text-4xl font-black mb-4" style={{ color: colors.primary }}>
          Your Cart
        </h1>
        <p className="text-lg mb-8 font-bold" style={{ color: colors.text + 'CC' }}>
          Your cart is empty
        </p>
        <Link
          href={`/storefront/${storeSlug}`}
          className="inline-block px-10 py-5 rounded-lg font-black text-white bold-button transition-all"
          style={{ 
            backgroundColor: colors.primary,
            boxShadow: `0 10px 30px ${colors.primary}50`,
          }}
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 slide-in-bold">
      <h1 className="text-4xl font-black mb-8" style={{ color: colors.primary }}>
        Your Cart
      </h1>

      <div className="space-y-4 mb-8">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-6 rounded-lg border-3 bold-card"
            style={{
              backgroundColor: colors.secondary,
              borderColor: colors.primary,
            }}
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="w-24 h-24 object-cover rounded-lg border-2"
                style={{ borderColor: colors.primary }}
              />
            )}
            <div className="flex-1">
              <h3 className="font-bold mb-1 text-lg" style={{ color: colors.text }}>
                {item.title}
              </h3>
              {item.variant && (
                <p className="text-sm mb-1 font-semibold" style={{ color: colors.text + 'CC' }}>
                  Variant: {item.variant}
                </p>
              )}
              <p className="font-black text-lg" style={{ color: colors.accent }}>
                {formatPrice(item.price || 0)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateQuantity(item.productId, item.variant, item.quantity - 1)}
                className="p-2 rounded bold-button border-2 font-bold"
                style={{ 
                  color: colors.primary,
                  borderColor: colors.primary,
                }}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-lg font-black" style={{ color: colors.text }}>
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.productId, item.variant, item.quantity + 1)}
                className="p-2 rounded bold-button border-2 font-bold"
                style={{ 
                  color: colors.primary,
                  borderColor: colors.primary,
                }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => removeItem(item.productId, item.variant)}
              className="p-2 rounded-lg bold-hover transition-all"
              style={{ color: colors.primary }}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t-4 pt-6" style={{ borderColor: colors.primary }}>
        <div className="flex justify-between items-center mb-6">
          <span className="text-2xl font-black" style={{ color: colors.text }}>
            Total:
          </span>
          <span className="text-3xl font-black" style={{ color: colors.accent }}>
            {formatPrice(getTotalPrice())}
          </span>
        </div>
        <button
          onClick={() => router.push(`/storefront/${storeSlug}/checkout`)}
          className="w-full px-8 py-5 rounded-lg font-black text-white bold-button transition-all"
          style={{ 
            backgroundColor: colors.primary,
            boxShadow: `0 10px 30px ${colors.primary}50`,
          }}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
