'use client';

import { useState } from 'react';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { useCartStore } from '@/store/useCartStore';
import { useRouter } from 'next/navigation';
import { notify } from '@/lib/toast';
import '../elegant/styles.css';

interface CheckoutProps {
  storeSlug: string;
  currency: string;
}

export default function Checkout({ storeSlug, currency }: CheckoutProps) {
  const { colors } = useStoreTheme();
  const { items, getTotalPrice } = useCartStore();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    notify.success('Order placed successfully!');
    router.push(`/storefront/${storeSlug}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 elegant-fade-in">
      <h1 className="text-4xl font-bold mb-8" style={{ color: colors.primary }}>
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-6" style={{ color: colors.primary }}>
                Shipping Information
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border elegant-input"
                  style={{
                    borderColor: colors.border || colors.accent + '30',
                    color: colors.text,
                    backgroundColor: colors.secondary + '30',
                  }}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border elegant-input"
                  style={{
                    borderColor: colors.border || colors.accent + '30',
                    color: colors.text,
                    backgroundColor: colors.secondary + '30',
                  }}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border elegant-input"
                  style={{
                    borderColor: colors.border || colors.accent + '30',
                    color: colors.text,
                    backgroundColor: colors.secondary + '30',
                  }}
                />
                <input
                  type="text"
                  name="address1"
                  placeholder="Address Line 1"
                  value={formData.address1}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border elegant-input"
                  style={{
                    borderColor: colors.border || colors.accent + '30',
                    color: colors.text,
                    backgroundColor: colors.secondary + '30',
                  }}
                />
                <input
                  type="text"
                  name="address2"
                  placeholder="Address Line 2"
                  value={formData.address2}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border elegant-input"
                  style={{
                    borderColor: colors.border || colors.accent + '30',
                    color: colors.text,
                    backgroundColor: colors.secondary + '30',
                  }}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border elegant-input"
                    style={{
                      borderColor: colors.border || colors.accent + '30',
                      color: colors.text,
                      backgroundColor: colors.secondary + '30',
                    }}
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border elegant-input"
                    style={{
                      borderColor: colors.border || colors.accent + '30',
                      color: colors.text,
                      backgroundColor: colors.secondary + '30',
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="zip"
                    placeholder="ZIP Code"
                    value={formData.zip}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border elegant-input"
                    style={{
                      borderColor: colors.border || colors.accent + '30',
                      color: colors.text,
                      backgroundColor: colors.secondary + '30',
                    }}
                  />
                  <input
                    type="text"
                    name="country"
                    placeholder="Country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border elegant-input"
                    style={{
                      borderColor: colors.border || colors.accent + '30',
                      color: colors.text,
                      backgroundColor: colors.secondary + '30',
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-8 py-4 rounded-lg font-bold text-white elegant-button transition-all"
              style={{ 
                backgroundColor: colors.accent,
                color: colors.primary,
                boxShadow: `0 8px 25px ${colors.accent}30`,
              }}
            >
              Place Order
            </button>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="p-8 rounded-lg border elegant-border-glow" style={{ 
            backgroundColor: colors.secondary + '30', 
            borderColor: colors.border || colors.accent + '30' 
          }}>
            <h2 className="text-2xl font-semibold mb-6" style={{ color: colors.primary }}>
              Order Summary
            </h2>
            <div className="space-y-3 mb-6">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm" style={{ color: colors.text + 'CC' }}>
                  <span>{item.title} x{item.quantity}</span>
                  <span>{formatPrice((item.price || 0) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4" style={{ borderColor: colors.border || colors.accent + '30' }}>
              <div className="flex justify-between font-bold text-xl">
                <span style={{ color: colors.text }}>Total:</span>
                <span style={{ color: colors.accent }}>{formatPrice(getTotalPrice())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
