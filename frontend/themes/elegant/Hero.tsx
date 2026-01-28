'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import Link from 'next/link';
import '../elegant/styles.css';

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
        backgroundColor: colors.secondary + '30',
      }}
    >
      <div className="absolute inset-0" style={{
        background: `linear-gradient(135deg, ${colors.secondary}10 0%, ${colors.accent}05 100%)`,
      }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center elegant-fade-in">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            style={{ 
              color: colors.primary,
              fontFamily: typography.headingFont,
            }}
          >
            {heading || `Welcome to ${storeName}`}
          </h1>
          {subheading && (
            <p
              className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed"
              style={{ color: colors.text + 'DD' }}
            >
              {subheading}
            </p>
          )}
          {ctaLink && (
            <Link
              href={ctaLink || `/storefront/${storeSlug}`}
              className="inline-block px-10 py-4 rounded-lg font-bold text-white elegant-button transition-all"
              style={{ 
                backgroundColor: colors.accent,
                color: colors.primary,
                boxShadow: `0 8px 25px ${colors.accent}30`,
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
