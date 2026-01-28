'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import Link from 'next/link';
import '../vintage/styles.css';

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
  const { colors, typography } = useStoreTheme();

  return (
    <section
      className="relative overflow-hidden py-24 md:py-32 vintage-paper"
      style={{ 
        backgroundColor: colors.background,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center vintage-fade">
          <h1
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
            style={{ 
              color: colors.primary,
              fontFamily: typography.headingFont,
            }}
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
              className="inline-block px-8 py-4 border-2 font-bold text-white vintage-button"
              style={{ 
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                boxShadow: `0 4px 12px ${colors.primary}30`,
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
