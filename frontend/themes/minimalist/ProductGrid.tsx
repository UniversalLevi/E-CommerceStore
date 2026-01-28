'use client';

import { useEffect, useRef } from 'react';
import ProductCard from './ProductCard';
import '../minimalist/styles.css';

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
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gridRef.current) {
      const items = gridRef.current.children;
      Array.from(items).forEach((item, index) => {
        (item as HTMLElement).style.animationDelay = `${index * 0.05}s`;
        (item as HTMLElement).classList.add('stagger-minimal');
      });
    }
  }, [products]);

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: '#2c3e5080' }}>No products found.</p>
      </div>
    );
  }

  return (
    <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          storeSlug={storeSlug}
          currency={currency}
        />
      ))}
    </div>
  );
}
