'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import Link from 'next/link';

interface HeroProps {
  storeSlug: string;
  storeName: string;
  heading?: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
}

export default function Hero({
  storeSlug,
  storeName,
  heading,
  subheading,
  ctaText = 'Shop Now',
  ctaLink,
}: HeroProps) {
  const { colors } = useStoreTheme();

  return (
    <section
      className="relative overflow-hidden py-20 md:py-32"
      style={{ 
        backgroundColor: colors.background,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
            style={{ color: colors.primary }}
          >
            {heading || `Welcome to ${storeName}`}
          </h1>
          {subheading && (
            <p
              className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
              style={{ color: colors.text + 'DD' }}
            >
              {subheading}
            </p>
          )}
          {ctaLink && (
            <Link
              href={ctaLink || `/storefront/${storeSlug}`}
              className="inline-block px-8 py-4 rounded-lg font-semibold text-white transition-all hover:opacity-90 hover:scale-105 shadow-lg"
              style={{ backgroundColor: colors.accent }}
            >
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
