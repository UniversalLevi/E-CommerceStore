'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import Link from 'next/link';
import '../neon/styles.css';

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
      className="relative overflow-hidden py-20 md:py-32 neon-bg-grid"
      style={{ 
        backgroundColor: colors.background,
      }}
    >
      <div className="absolute inset-0" style={{
        background: `radial-gradient(circle at 50% 50%, ${colors.primary}10 0%, transparent 70%)`,
      }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center slide-up">
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight neon-glow neon-pulse"
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
              className="inline-block px-8 py-4 rounded-lg font-bold text-black neon-button transition-all hover:scale-105"
              style={{ 
                backgroundColor: colors.primary,
                color: '#000',
                boxShadow: `0 0 20px ${colors.primary}, 0 0 40px ${colors.primary}50`,
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
