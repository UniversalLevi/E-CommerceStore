'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import '../vintage/styles.css';

interface AboutProps {
  storeSlug: string;
  storeName: string;
}

export default function About({ storeSlug, storeName }: AboutProps) {
  const { colors, typography } = useStoreTheme();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 vintage-fade">
      <h1 className="text-4xl font-bold mb-8" style={{ 
        color: colors.primary,
        fontFamily: typography.headingFont,
      }}>
        About {storeName}
      </h1>

      <div className="space-y-8 text-base leading-relaxed" style={{ color: colors.text + 'DD' }}>
        <p>
          Welcome to {storeName}, your trusted destination for quality products and exceptional service.
        </p>
        <p>
          We are committed to providing you with the best shopping experience, offering a wide selection
          of products at competitive prices with classic charm.
        </p>
        
        <div className="border-t-2 pt-8" style={{ borderColor: colors.border || colors.primary }}>
          <h2 className="text-2xl font-semibold mb-4" style={{ 
            color: colors.primary,
            fontFamily: typography.headingFont,
          }}>
            Our Mission
          </h2>
          <p>
            Our mission is to deliver exceptional value to our customers through quality products,
            outstanding customer service, and a classic shopping experience.
          </p>
        </div>

        <div className="border-t-2 pt-8" style={{ borderColor: colors.border || colors.primary }}>
          <h2 className="text-2xl font-semibold mb-4" style={{ 
            color: colors.primary,
            fontFamily: typography.headingFont,
          }}>
            Why Choose Us
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Quality products at competitive prices</li>
            <li>Fast and reliable shipping</li>
            <li>Excellent customer support</li>
            <li>Secure payment processing</li>
            <li>Classic shopping experience</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
