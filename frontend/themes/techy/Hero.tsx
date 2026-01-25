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
  const { colors, typography } = useStoreTheme();

  return (
    <section
      className="relative overflow-hidden py-24 md:py-32 border-b-2"
      style={{ backgroundColor: colors.background, borderColor: colors.accent }}
    >
      <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(45deg, ${colors.accent} 0%, transparent 100%)` }}></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1
          className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter"
          style={{ color: colors.accent, fontFamily: typography.fontFamily }}
        >
          {'>'} {heading || storeName}
        </h1>
        {subheading && (
          <p
            className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto"
            style={{ color: colors.text + 'CC' }}
          >
            {subheading}
          </p>
        )}
        {ctaLink && (
          <Link
            href={ctaLink || `/storefront/${storeSlug}`}
            className="inline-block px-10 py-4 border-2 font-bold transition-all hover:opacity-80 uppercase tracking-wider"
            style={{ borderColor: colors.accent, color: colors.accent, backgroundColor: 'transparent' }}
          >
            {ctaText}
          </Link>
        )}
      </div>
    </section>
  );
}
