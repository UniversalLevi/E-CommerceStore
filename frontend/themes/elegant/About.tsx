'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import '../elegant/styles.css';

interface AboutProps {
  storeSlug: string;
  storeName: string;
}

export default function About({ storeSlug, storeName }: AboutProps) {
  const { colors, typography } = useStoreTheme();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 elegant-fade-in">
      <h1 className="text-5xl font-bold mb-8" style={{ 
        color: colors.primary,
        fontFamily: typography.headingFont,
      }}>
        About {storeName}
      </h1>

      <div className="space-y-8 text-lg leading-relaxed" style={{ color: colors.text + 'DD' }}>
        <p>
          Welcome to {storeName}, your trusted destination for luxury products and exceptional service.
        </p>
        <p>
          We are committed to providing you with the finest shopping experience, offering a curated selection
          of premium products at competitive prices.
        </p>
        
        <div className="border-t pt-8" style={{ borderColor: colors.border || colors.accent + '30' }}>
          <h2 className="text-3xl font-semibold mb-4" style={{ 
            color: colors.primary,
            fontFamily: typography.headingFont,
          }}>
            Our Mission
          </h2>
          <p>
            Our mission is to deliver exceptional value to our customers through quality products,
            outstanding customer service, and a luxurious shopping experience.
          </p>
        </div>

        <div className="border-t pt-8" style={{ borderColor: colors.border || colors.accent + '30' }}>
          <h2 className="text-3xl font-semibold mb-4" style={{ 
            color: colors.primary,
            fontFamily: typography.headingFont,
          }}>
            Why Choose Us
          </h2>
          <ul className="list-disc pl-6 space-y-3">
            <li>Premium quality products at competitive prices</li>
            <li>Fast and reliable shipping</li>
            <li>Excellent customer support</li>
            <li>Secure payment processing</li>
            <li>Luxury shopping experience</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
