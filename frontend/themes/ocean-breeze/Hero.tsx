'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';

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
        background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.secondary} 100%)`,
      }}
    >
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
            <a
              href={ctaLink || `https://${storeSlug}.eazydropshipping.com?category=all`}
              className="inline-block px-8 py-4 rounded-lg font-semibold text-white transition-all hover:opacity-90 hover:scale-105 shadow-lg"
              style={{ backgroundColor: colors.accent }}
            >
              {ctaText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
