'use client';

import { useState } from 'react';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { useCartStore } from '@/store/useCartStore';
import { notify } from '@/lib/toast';

interface CheckoutProps {
  storeSlug: string;
  currency: string;
}

export default function Checkout({ storeSlug, currency }: CheckoutProps) {
  const { colors } = useStoreTheme();
  const { items, getTotalPrice } = useCartStore();
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
    window.location.href = `https://${storeSlug}.eazyds.com`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8" style={{ color: colors.primary }}>
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: colors.primary }}>
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
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: colors.secondary,
                    borderColor: colors.border || colors.primary + '40',
                    color: colors.text,
                  }}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: colors.secondary,
                    borderColor: colors.border || colors.primary + '40',
                    color: colors.text,
                  }}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: colors.secondary,
                    borderColor: colors.border || colors.primary + '40',
                    color: colors.text,
                  }}
                />
                <input
                  type="text"
                  name="address1"
                  placeholder="Address Line 1"
                  value={formData.address1}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: colors.secondary,
                    borderColor: colors.border || colors.primary + '40',
                    color: colors.text,
                  }}
                />
                <input
                  type="text"
                  name="address2"
                  placeholder="Address Line 2"
                  value={formData.address2}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: colors.secondary,
                    borderColor: colors.border || colors.primary + '40',
                    color: colors.text,
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
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: colors.secondary,
                      borderColor: colors.border || colors.primary + '40',
                      color: colors.text,
                    }}
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: colors.secondary,
                      borderColor: colors.border || colors.primary + '40',
                      color: colors.text,
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
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: colors.secondary,
                      borderColor: colors.border || colors.primary + '40',
                      color: colors.text,
                    }}
                  />
                  <input
                    type="text"
                    name="country"
                    placeholder="Country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: colors.secondary,
                      borderColor: colors.border || colors.primary + '40',
                      color: colors.text,
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-4 rounded-lg font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: colors.accent }}
            >
              Place Order
            </button>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="p-6 rounded-lg border backdrop-blur-sm" style={{ backgroundColor: colors.secondary + '80', borderColor: colors.border || colors.primary + '40' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: colors.primary }}>
              Order Summary
            </h2>
            <div className="space-y-2 mb-4">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm" style={{ color: colors.text + 'CC' }}>
                  <span>{item.title} x{item.quantity}</span>
                  <span>{formatPrice((item.price || 0) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4" style={{ borderColor: colors.border || colors.primary + '40' }}>
              <div className="flex justify-between font-bold text-lg">
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
