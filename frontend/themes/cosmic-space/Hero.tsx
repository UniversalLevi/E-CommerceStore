'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import './styles.css';

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
        background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.secondary} 50%, #312e81 100%)`,
      }}
    >
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(167, 139, 250, 0.4) 0%, transparent 70%)',
            animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
            animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            animationDelay: '2s',
          }}
        ></div>
      </div>
      
      {/* Starfield effect */}
      <div className="absolute inset-0 opacity-20" style={{ 
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)', 
        backgroundSize: '60px 60px',
        animation: 'twinkle 20s linear infinite',
      }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="text-center">
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent"
            style={{ 
              textShadow: '0 0 30px rgba(167, 139, 250, 0.5)',
            }}
          >
            {heading || `Welcome to ${storeName}`}
          </h1>
          {subheading && (
            <p
              className="text-lg md:text-xl lg:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed"
              style={{ 
                color: colors.text,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
              }}
            >
              {subheading}
            </p>
          )}
          {ctaLink && (
            <a
              href={ctaLink || `https://${storeSlug}.eazyds.com?category=all`}
              className="inline-block px-10 py-5 rounded-xl font-semibold text-white transition-all hover:scale-110 shadow-2xl relative overflow-hidden group"
              style={{ 
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)`,
                boxShadow: '0 10px 30px rgba(139, 92, 246, 0.5), 0 0 40px rgba(99, 102, 241, 0.3)',
              }}
            >
              <span className="relative z-10">{ctaText}</span>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
                }}
              ></div>
            </a>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </section>
  );
}
