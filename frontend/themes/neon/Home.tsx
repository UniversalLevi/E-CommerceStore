'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import Hero from './Hero';
import ProductGrid from './ProductGrid';
import '../neon/styles.css';

interface HomeProps {
  storeSlug: string;
  storeName: string;
  products: Array<{
    _id: string;
    title: string;
    basePrice: number;
    images?: string[];
    slug: string;
  }>;
  currency: string;
}

export default function Home({ storeSlug, storeName, products, currency }: HomeProps) {
  const { colors } = useStoreTheme();

  return (
    <div>
      <Hero
        storeSlug={storeSlug}
        storeName={storeName}
        heading={`Welcome to ${storeName}`}
        subheading="Discover our amazing collection of products in the digital future"
        ctaText="Shop Now"
        ctaLink={`/storefront/${storeSlug}?category=all`}
      />

      <section className="py-16 neon-bg-grid" style={{ backgroundColor: colors.background }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center neon-glow slide-up" style={{ 
            color: colors.primary,
          }}>
            Featured Products
          </h2>
          <ProductGrid products={products} storeSlug={storeSlug} currency={currency} />
        </div>
      </section>
    </div>
  );
}
