'use client';

import ProductCard from './ProductCard';
import './styles.css';

interface ProductGridProps {
  products: Array<{
    _id: string;
    title: string;
    basePrice: number;
    images?: string[];
    slug: string;
  }>;
  storeSlug: string;
  currency: string;
}

export default function ProductGrid({ products, storeSlug, currency }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 animate-fadeIn relative z-10">
        <p style={{ color: '#e0e7ff', opacity: 0.7 }}>No products found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <div
          key={product._id}
          style={{
            animation: `fadeIn 0.6s ease-out ${index * 0.1}s both`,
          }}
          className="relative z-10"
        >
          <ProductCard
            product={product}
            storeSlug={storeSlug}
            currency={currency}
          />
        </div>
      ))}
    </div>
  );
}
