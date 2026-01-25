'use client';

import Link from 'next/link';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import Image from 'next/image';

interface ProductCardProps {
  product: {
    _id: string;
    title: string;
    basePrice: number;
    images?: string[];
    slug: string;
  };
  storeSlug: string;
  currency: string;
}

export default function ProductCard({ product, storeSlug, currency }: ProductCardProps) {
  const { colors } = useStoreTheme();

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

  return (
    <Link
      href={`/storefront/${storeSlug}/products/${product._id}`}
      className="group block h-full"
    >
      <div
        className="rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col"
        style={{
          backgroundColor: colors.secondary || colors.background,
          borderColor: colors.primary + '20',
        }}
      >
        {/* Product Image */}
        <div className="aspect-square relative overflow-hidden bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: colors.primary + '10' }}
            >
              <span className="text-sm" style={{ color: colors.text + '60' }}>No Image</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5 flex-1 flex flex-col">
          <h3
            className="font-semibold mb-3 line-clamp-2 group-hover:opacity-80 transition-opacity text-base"
            style={{ color: colors.text }}
          >
            {product.title}
          </h3>
          <div className="mt-auto">
            <p
              className="text-xl font-bold"
              style={{ color: colors.accent }}
            >
              {formatPrice(product.basePrice)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
