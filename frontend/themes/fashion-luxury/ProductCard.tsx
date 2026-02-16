'use client';

import Link from 'next/link';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { getImageUrl } from '@/lib/imageUrl';

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
  const { colors, typography } = useStoreTheme();

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
      className="group block"
    >
      <div
        className="rounded-sm overflow-hidden border transition-all duration-300 hover:shadow-xl"
        style={{
          backgroundColor: colors.secondary,
          borderColor: colors.accent + '30',
        }}
      >
        <div className="aspect-square relative overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={getImageUrl(product.images[0])}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: colors.primary + '10' }}
            >
              <span style={{ color: colors.text + '60' }}>No Image</span>
            </div>
          )}
        </div>
        <div className="p-6">
          <h3
            className="font-serif mb-3 line-clamp-2 group-hover:opacity-80 transition-opacity"
            style={{ color: colors.text, fontFamily: typography.headingFont }}
          >
            {product.title}
          </h3>
          <p
            className="text-xl font-semibold tracking-wide"
            style={{ color: colors.accent }}
          >
            {formatPrice(product.basePrice)}
          </p>
        </div>
      </div>
    </Link>
  );
}
