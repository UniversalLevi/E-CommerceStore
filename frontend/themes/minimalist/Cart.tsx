'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { useCartStore } from '@/store/useCartStore';
import { Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../minimalist/styles.css';

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center minimalist-fade">
        <h1 className="text-3xl font-medium mb-4" style={{ color: colors.primary }}>
          Your Cart
        </h1>
        <p className="text-sm mb-8" style={{ color: colors.text + '80' }}>
          Your cart is empty
        </p>
        <Link
          href={`/storefront/${storeSlug}`}
          className="inline-block px-8 py-3 border minimalist-button"
          style={{ 
            borderColor: colors.primary,
            color: colors.primary,
          }}
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 minimalist-fade">
      <h1 className="text-3xl font-medium mb-12" style={{ color: colors.primary }}>
        Your Cart
      </h1>

      <div className="space-y-6 mb-12">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-6 p-6 minimalist-card"
            style={{
              borderColor: colors.border || colors.primary + '10',
            }}
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="w-20 h-20 object-cover"
                style={{ border: `1px solid ${colors.border || colors.primary + '10'}` }}
              />
            )}
            <div className="flex-1">
              <h3 className="font-normal mb-1 text-sm" style={{ color: colors.text }}>
                {item.title}
              </h3>
              {item.variant && (
                <p className="text-xs mb-1" style={{ color: colors.text + '60' }}>
                  Variant: {item.variant}
                </p>
              )}
              <p className="font-medium text-sm" style={{ color: colors.accent }}>
                {formatPrice(item.price || 0)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateQuantity(item.productId, item.variant, item.quantity - 1)}
                className="p-1 minimalist-button border"
                style={{ 
                  color: colors.primary,
                  borderColor: colors.border || colors.primary + '20',
                }}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-medium" style={{ color: colors.text }}>
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.productId, item.variant, item.quantity + 1)}
                className="p-1 minimalist-button border"
                style={{ 
                  color: colors.primary,
                  borderColor: colors.border || colors.primary + '20',
                }}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <button
              onClick={() => removeItem(item.productId, item.variant)}
              className="p-2 minimalist-hover"
              style={{ color: colors.text + '60' }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t pt-6" style={{ borderColor: colors.border || colors.primary + '10' }}>
        <div className="flex justify-between items-center mb-6">
          <span className="text-lg font-medium" style={{ color: colors.text }}>
            Total:
          </span>
          <span className="text-xl font-medium" style={{ color: colors.accent }}>
            {formatPrice(getTotalPrice())}
          </span>
        </div>
        <button
          onClick={() => router.push(`/storefront/${storeSlug}/checkout`)}
          className="w-full px-6 py-3 minimalist-button text-white"
          style={{ 
            backgroundColor: colors.accent,
          }}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
