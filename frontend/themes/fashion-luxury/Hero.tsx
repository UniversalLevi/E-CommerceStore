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
      className="relative overflow-hidden py-32 md:py-40"
      style={{ backgroundColor: colors.background }}
    >
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V4h4V2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V4h4V2H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1
          className="text-6xl md:text-8xl font-serif mb-8 tracking-tight"
          style={{ color: colors.primary, fontFamily: typography.headingFont }}
        >
          {heading || storeName}
        </h1>
        {subheading && (
          <p
            className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed"
            style={{ color: colors.text + 'CC' }}
          >
            {subheading}
          </p>
        )}
        {ctaLink && (
          <Link
            href={ctaLink || `/storefront/${storeSlug}`}
            className="inline-block px-12 py-4 rounded-sm font-semibold text-white transition-all hover:opacity-90 uppercase tracking-widest text-sm"
            style={{ backgroundColor: colors.accent }}
          >
            {ctaText}
          </Link>
        )}
      </div>
    </section>
  );
}
