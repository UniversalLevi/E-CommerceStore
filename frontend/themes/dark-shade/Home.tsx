'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import Hero from './Hero';
import ProductGrid from './ProductGrid';
import './styles.css';

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
        subheading="Discover our premium collection of products"
        ctaText="Shop Now"
        ctaLink={`https://${storeSlug}.eazyds.com?category=all`}
      />

      <section className="py-20 relative" style={{ 
        background: 'linear-gradient(180deg, rgba(15, 15, 15, 1) 0%, rgba(10, 10, 10, 1) 100%)',
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-12 text-center tracking-tight animate-fadeIn" 
            style={{ 
              color: colors.primary,
              textShadow: '0 2px 20px rgba(255, 255, 255, 0.1)',
              animation: 'fadeIn 0.8s ease-out',
            }}
          >
            Featured Products
          </h2>
          <ProductGrid products={products} storeSlug={storeSlug} currency={currency} />
        </div>
      </section>
    </div>
  );
}
