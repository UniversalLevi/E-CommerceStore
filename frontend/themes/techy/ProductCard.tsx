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
        className="border-2 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-accent/20"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.accent,
        }}
      >
        <div className="aspect-square relative overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={getImageUrl(product.images[0])}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: colors.primary + '20' }}
            >
              <span style={{ color: colors.accent + '80' }}>No Image</span>
            </div>
          )}
        </div>
        <div className="p-4 border-t-2" style={{ borderColor: colors.accent }}>
          <h3
            className="font-bold mb-2 line-clamp-2 group-hover:opacity-80 transition-opacity"
            style={{ color: colors.text, fontFamily: typography.fontFamily }}
          >
            {product.title}
          </h3>
          <p
            className="text-lg font-bold"
            style={{ color: colors.accent }}
          >
            {formatPrice(product.basePrice)}
          </p>
        </div>
      </div>
    </Link>
  );
}
