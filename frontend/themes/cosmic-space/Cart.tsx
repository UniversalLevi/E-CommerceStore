'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { useCartStore } from '@/store/useCartStore';
import { Trash2, Plus, Minus } from 'lucide-react';
import './styles.css';

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center relative z-10 animate-fadeIn">
        <h1 className="text-3xl font-bold mb-4 animate-slideIn" style={{ color: colors.primary }}>
          Your Cart
        </h1>
        <p className="text-lg mb-8" style={{ color: '#e0e7ff', opacity: 0.8 }}>
          Your cart is empty
        </p>
        <a
          href={`https://${storeSlug}.eazyds.com`}
          className="inline-block px-6 py-3 rounded-lg font-medium text-white"
          style={{ backgroundColor: colors.accent }}
        >
          Continue Shopping
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 animate-fadeIn">
      <h1 className="text-3xl font-bold mb-8 animate-slideIn" style={{ color: colors.primary }}>
        Your Cart
      </h1>

      <div className="space-y-4 mb-8">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 rounded-xl border backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-fadeIn relative z-10"
            style={{
              backgroundColor: 'rgba(30, 27, 75, 0.6)',
              borderColor: 'rgba(167, 139, 250, 0.4)',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
              animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`,
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
                <p className="text-sm mb-1" style={{ color: '#e0e7ff', opacity: 0.7 }}>
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

      <div className="border-t pt-6 animate-fadeIn relative z-10" style={{ borderColor: 'rgba(167, 139, 250, 0.3)' }}>
        <div className="flex justify-between items-center mb-6">
          <span className="text-xl font-semibold" style={{ color: colors.text }}>
            Total:
          </span>
          <span className="text-2xl font-bold" style={{ color: colors.accent }}>
            {formatPrice(getTotalPrice())}
          </span>
        </div>
        <a
          href={`https://${storeSlug}.eazyds.com/checkout`}
          className="block w-full px-6 py-4 rounded-xl font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl text-center relative overflow-hidden group relative z-10"
          style={{ 
            backgroundColor: colors.accent,
            boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
          }}
        >
          <span className="relative z-10">Proceed to Checkout</span>
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
            }}
          ></div>
          Proceed to Checkout
        </a>
      </div>
    </div>
  );
}
