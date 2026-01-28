'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import Link from 'next/link';
import '../minimalist/styles.css';

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
      className="relative overflow-hidden py-32 md:py-40"
      style={{ 
        backgroundColor: colors.background,
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center minimalist-fade">
          <h1
            className="text-4xl md:text-5xl font-medium mb-6 leading-tight"
            style={{ color: colors.primary }}
          >
            {heading || `Welcome to ${storeName}`}
          </h1>
          {subheading && (
            <p
              className="text-base md:text-lg mb-12 max-w-xl mx-auto leading-relaxed"
              style={{ color: colors.text + '80' }}
            >
              {subheading}
            </p>
          )}
          {ctaLink && (
            <Link
              href={ctaLink || `/storefront/${storeSlug}`}
              className="inline-block px-8 py-3 border minimalist-button"
              style={{ 
                borderColor: colors.primary,
                color: colors.primary,
                backgroundColor: 'transparent',
              }}
            >
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
