'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import Link from 'next/link';
import '../bold/styles.css';

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
      className="relative overflow-hidden py-24 md:py-32"
      style={{ 
        backgroundColor: colors.border + '20',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center slide-in-bold">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight"
            style={{ 
              color: colors.primary,
              fontFamily: typography.headingFont,
            }}
          >
            {heading || `Welcome to ${storeName}`}
          </h1>
          {subheading && (
            <p
              className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed font-bold"
              style={{ color: colors.text + 'DD' }}
            >
              {subheading}
            </p>
          )}
          {ctaLink && (
            <Link
              href={ctaLink || `/storefront/${storeSlug}`}
              className="inline-block px-10 py-5 rounded-lg font-black text-white bold-button transition-all"
              style={{ 
                backgroundColor: colors.primary,
                color: '#fff',
                boxShadow: `0 10px 30px ${colors.primary}50`,
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
