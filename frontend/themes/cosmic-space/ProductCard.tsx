'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { getImageUrl } from '@/lib/imageUrl';
import './styles.css';

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
    <a
      href={`https://${storeSlug}.eazyds.com/products/${product._id}`}
      className="group block h-full"
    >
      <div
        className="rounded-lg overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full flex flex-col backdrop-blur-xl product-card relative z-10"
        style={{
          backgroundColor: 'rgba(30, 27, 75, 0.6)',
          borderColor: 'rgba(167, 139, 250, 0.4)',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.2)',
        }}
      >
        <div className="aspect-square relative overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img
              src={getImageUrl(product.images[0])}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(30, 27, 75, 0.8)' }}
            >
              <span className="text-sm relative z-10" style={{ color: '#e0e7ff', opacity: 0.6 }}>No Image</span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col relative z-10">
          <h3
            className="font-semibold mb-2 line-clamp-2 group-hover:opacity-90 transition-opacity"
            style={{ color: '#e0e7ff' }}
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
    </a>
  );
}
