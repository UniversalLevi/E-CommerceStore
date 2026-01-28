'use client';

import { useEffect, useRef } from 'react';
import ProductCard from './ProductCard';
import '../vintage/styles.css';

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
        (item as HTMLElement).style.animationDelay = `${index * 0.1}s`;
        (item as HTMLElement).classList.add('stagger-vintage');
      });
    }
  }, [products]);

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p style={{ color: '#70421480' }}>No products found.</p>
      </div>
    );
  }

  return (
    <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
