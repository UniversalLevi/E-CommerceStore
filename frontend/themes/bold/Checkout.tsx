'use client';

import { useState } from 'react';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { useCartStore } from '@/store/useCartStore';
import { useRouter } from 'next/navigation';
import { notify } from '@/lib/toast';
import '../bold/styles.css';

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 slide-in-bold">
      <h1 className="text-4xl font-black mb-8" style={{ color: colors.primary }}>
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-black mb-6" style={{ color: colors.primary }}>
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
                  className="w-full px-4 py-3 rounded-lg border-2 bold-input font-semibold"
                  style={{
                    borderColor: colors.primary,
                    color: colors.text,
                    backgroundColor: colors.secondary,
                  }}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 bold-input font-semibold"
                  style={{
                    borderColor: colors.primary,
                    color: colors.text,
                    backgroundColor: colors.secondary,
                  }}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 bold-input font-semibold"
                  style={{
                    borderColor: colors.primary,
                    color: colors.text,
                    backgroundColor: colors.secondary,
                  }}
                />
                <input
                  type="text"
                  name="address1"
                  placeholder="Address Line 1"
                  value={formData.address1}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 bold-input font-semibold"
                  style={{
                    borderColor: colors.primary,
                    color: colors.text,
                    backgroundColor: colors.secondary,
                  }}
                />
                <input
                  type="text"
                  name="address2"
                  placeholder="Address Line 2"
                  value={formData.address2}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-2 bold-input font-semibold"
                  style={{
                    borderColor: colors.primary,
                    color: colors.text,
                    backgroundColor: colors.secondary,
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
                    className="w-full px-4 py-3 rounded-lg border-2 bold-input font-semibold"
                    style={{
                      borderColor: colors.primary,
                      color: colors.text,
                      backgroundColor: colors.secondary,
                    }}
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 bold-input font-semibold"
                    style={{
                      borderColor: colors.primary,
                      color: colors.text,
                      backgroundColor: colors.secondary,
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
                    className="w-full px-4 py-3 rounded-lg border-2 bold-input font-semibold"
                    style={{
                      borderColor: colors.primary,
                      color: colors.text,
                      backgroundColor: colors.secondary,
                    }}
                  />
                  <input
                    type="text"
                    name="country"
                    placeholder="Country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 bold-input font-semibold"
                    style={{
                      borderColor: colors.primary,
                      color: colors.text,
                      backgroundColor: colors.secondary,
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-8 py-5 rounded-lg font-black text-white bold-button transition-all"
              style={{ 
                backgroundColor: colors.primary,
                boxShadow: `0 10px 30px ${colors.primary}50`,
              }}
            >
              Place Order
            </button>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="p-8 rounded-lg border-4" style={{ 
            backgroundColor: colors.secondary, 
            borderColor: colors.primary 
          }}>
            <h2 className="text-2xl font-black mb-6" style={{ color: colors.primary }}>
              Order Summary
            </h2>
            <div className="space-y-3 mb-6">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm font-semibold" style={{ color: colors.text + 'CC' }}>
                  <span>{item.title} x{item.quantity}</span>
                  <span>{formatPrice((item.price || 0) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t-2 pt-4" style={{ borderColor: colors.primary }}>
              <div className="flex justify-between font-black text-xl">
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
