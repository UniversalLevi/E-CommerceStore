'use client';

import Link from 'next/link';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { getImageUrl } from '@/lib/imageUrl';
import '../vintage/styles.css';

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
        className="vintage-card h-full flex flex-col"
        style={{
          borderColor: colors.border || colors.primary,
        }}
      >
        <div className="aspect-square relative overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={getImageUrl(product.images[0])}
              alt={product.title}
              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-500"
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center vintage-paper"
              style={{ backgroundColor: colors.secondary }}
            >
              <span className="text-sm" style={{ color: colors.text + '60' }}>No Image</span>
            </div>
          )}
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <h3
            className="font-semibold mb-2 line-clamp-2 group-hover:opacity-80 transition-opacity"
            style={{ color: colors.text }}
          >
            {product.title}
          </h3>
          <div className="mt-auto">
            <p
              className="text-lg font-bold"
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
