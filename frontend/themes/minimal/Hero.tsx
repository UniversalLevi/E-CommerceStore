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
      className="relative overflow-hidden py-24 md:py-40"
      style={{ 
        backgroundColor: colors.background,
        backgroundImage: `linear-gradient(135deg, ${colors.background} 0%, ${colors.secondary || colors.background} 100%)`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          style={{ color: colors.primary }}
        >
          {heading || `Welcome to ${storeName}`}
        </h1>
        {subheading && (
          <p
            className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed"
            style={{ color: colors.text + 'DD' }}
          >
            {subheading}
          </p>
        )}
        {ctaLink && (
          <Link
            href={ctaLink || `/storefront/${storeSlug}`}
            className="inline-block px-10 py-4 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:scale-105 shadow-lg hover:shadow-xl"
            style={{ backgroundColor: colors.accent }}
          >
            {ctaText}
          </Link>
        )}
      </div>
    </section>
  );
}
