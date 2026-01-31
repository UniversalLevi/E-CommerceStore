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
        background: 'linear-gradient(135deg, #0a0a0a 0%, #0f0f0f 50%, #1a1a1a 100%)',
      }}
    >
      {/* Premium gradient overlays */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ 
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
          }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{ 
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)',
          }}
        ></div>
      </div>
      
      {/* Subtle grid texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ 
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', 
        backgroundSize: '50px 50px',
      }}></div>
      
      {/* Animated shine effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-0 animate-shine"
          style={{
            background: 'linear-gradient(110deg, transparent 40%, rgba(255, 255, 255, 0.05) 50%, transparent 60%)',
            animation: 'shine 8s infinite',
          }}
        ></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight"
            style={{ 
              color: colors.primary,
              textShadow: '0 2px 20px rgba(255, 255, 255, 0.1), 0 0 40px rgba(255, 255, 255, 0.05)',
              letterSpacing: '-0.02em',
            }}
          >
            {heading || `Welcome to ${storeName}`}
          </h1>
          {subheading && (
            <p
              className="text-lg md:text-xl lg:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed font-light"
              style={{ 
                color: colors.text,
                opacity: 0.85,
                textShadow: '0 1px 10px rgba(0, 0, 0, 0.5)',
              }}
            >
              {subheading}
            </p>
          )}
          {ctaLink && (
            <a
              href={ctaLink || `https://${storeSlug}.eazydropshipping.com?category=all`}
              className="inline-block px-10 py-5 rounded-xl font-semibold text-white transition-all hover:scale-110 shadow-2xl relative overflow-hidden group"
              style={{ 
                backgroundColor: '#64748b',
                boxShadow: '0 10px 30px rgba(100, 116, 139, 0.4), 0 0 40px rgba(100, 116, 139, 0.2)',
              }}
            >
              <span className="relative z-10">{ctaText}</span>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
                }}
              ></div>
            </a>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}
