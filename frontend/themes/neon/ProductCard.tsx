'use client';

import Link from 'next/link';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import '../neon/styles.css';

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
        className="rounded-lg overflow-hidden border neon-card h-full flex flex-col bg-black/50 backdrop-blur-sm"
        style={{
          borderColor: colors.border || colors.primary + '50',
        }}
      >
        <div className="aspect-square relative overflow-hidden bg-black">
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
              style={{ backgroundColor: colors.secondary }}
            >
              <span className="text-sm" style={{ color: colors.text + '60' }}>No Image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3
            className="font-semibold mb-2 line-clamp-2 group-hover:neon-glow transition-all"
            style={{ color: colors.text }}
          >
            {product.title}
          </h3>
          <div className="mt-auto">
            <p
              className="text-lg font-bold neon-glow"
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
