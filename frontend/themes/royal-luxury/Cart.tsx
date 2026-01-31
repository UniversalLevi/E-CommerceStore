'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { useCartStore } from '@/store/useCartStore';
import { Trash2, Plus, Minus } from 'lucide-react';

interface CartProps {
  storeSlug: string;
  currency: string;
}

export default function Cart({ storeSlug, currency }: CartProps) {
  const { colors } = useStoreTheme();
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4" style={{ color: colors.primary }}>
          Your Cart
        </h1>
        <p className="text-lg mb-8" style={{ color: colors.text + 'CC' }}>
          Your cart is empty
        </p>
        <a
          href={`https://${storeSlug}.eazydropshipping.com`}
          className="inline-block px-6 py-3 rounded-lg font-medium text-white"
          style={{ backgroundColor: colors.accent }}
        >
          Continue Shopping
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8" style={{ color: colors.primary }}>
        Your Cart
      </h1>

      <div className="space-y-4 mb-8">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 rounded-lg border backdrop-blur-sm"
            style={{
              backgroundColor: colors.secondary + '80',
              borderColor: colors.border || colors.primary + '40',
            }}
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold mb-1" style={{ color: colors.text }}>
                {item.title}
              </h3>
              {item.variant && (
                <p className="text-sm mb-1" style={{ color: colors.text + 'CC' }}>
                  Variant: {item.variant}
                </p>
              )}
              <p className="font-bold" style={{ color: colors.accent }}>
                {formatPrice(item.price || 0)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.productId, item.variant, item.quantity - 1)}
                className="p-1 rounded"
                style={{ color: colors.primary }}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span style={{ color: colors.text }}>{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.productId, item.variant, item.quantity + 1)}
                className="p-1 rounded"
                style={{ color: colors.primary }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => removeItem(item.productId, item.variant)}
              className="p-2 rounded-lg hover:opacity-80 transition-opacity"
              style={{ color: colors.primary }}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t pt-6" style={{ borderColor: colors.border || colors.primary + '40' }}>
        <div className="flex justify-between items-center mb-6">
          <span className="text-xl font-semibold" style={{ color: colors.text }}>
            Total:
          </span>
          <span className="text-2xl font-bold" style={{ color: colors.accent }}>
            {formatPrice(getTotalPrice())}
          </span>
        </div>
        <a
          href={`https://${storeSlug}.eazydropshipping.com/checkout`}
          className="block w-full px-6 py-4 rounded-lg font-medium text-white transition-all hover:opacity-90 text-center"
          style={{ backgroundColor: colors.accent }}
        >
          Proceed to Checkout
        </a>
      </div>
    </div>
  );
}
