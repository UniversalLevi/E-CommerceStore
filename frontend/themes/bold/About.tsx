'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import '../bold/styles.css';

interface AboutProps {
  storeSlug: string;
  storeName: string;
}

export default function About({ storeSlug, storeName }: AboutProps) {
  const { colors, typography } = useStoreTheme();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 slide-in-bold">
      <h1 className="text-5xl font-black mb-8" style={{ 
        color: colors.primary,
        fontFamily: typography.headingFont,
      }}>
        About {storeName}
      </h1>

      <div className="space-y-8 text-lg leading-relaxed font-semibold" style={{ color: colors.text + 'DD' }}>
        <p>
          Welcome to {storeName}, your trusted destination for quality products and exceptional service.
        </p>
        <p>
          We are committed to providing you with the best shopping experience, offering a wide selection
          of products at competitive prices with energetic enthusiasm.
        </p>
        
        <div className="border-t-4 pt-8" style={{ borderColor: colors.primary }}>
          <h2 className="text-3xl font-black mb-4" style={{ 
            color: colors.primary,
            fontFamily: typography.headingFont,
          }}>
            Our Mission
          </h2>
          <p>
            Our mission is to deliver exceptional value to our customers through quality products,
            outstanding customer service, and an energetic shopping experience.
          </p>
        </div>

        <div className="border-t-4 pt-8" style={{ borderColor: colors.primary }}>
          <h2 className="text-3xl font-black mb-4" style={{ 
            color: colors.primary,
            fontFamily: typography.headingFont,
          }}>
            Why Choose Us
          </h2>
          <ul className="list-disc pl-6 space-y-3 font-bold">
            <li>Quality products at competitive prices</li>
            <li>Fast and reliable shipping</li>
            <li>Excellent customer support</li>
            <li>Secure payment processing</li>
            <li>Energetic shopping experience</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
