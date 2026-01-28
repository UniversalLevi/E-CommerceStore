'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import '../neon/styles.css';

interface AboutProps {
  storeSlug: string;
  storeName: string;
}

export default function About({ storeSlug, storeName }: AboutProps) {
  const { colors, typography } = useStoreTheme();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 slide-up">
      <h1 className="text-4xl font-bold mb-8 neon-glow" style={{ 
        color: colors.primary,
        fontFamily: typography.headingFont,
      }}>
        About {storeName}
      </h1>

      <div className="space-y-8" style={{ color: colors.text + 'DD' }}>
        <p className="text-lg leading-relaxed">
          Welcome to {storeName}, your trusted destination for quality products and exceptional service in the digital age.
        </p>
        <p className="text-lg leading-relaxed">
          We are committed to providing you with the best shopping experience, offering a wide selection
          of products at competitive prices with cutting-edge technology.
        </p>
        
        <div className="border-t pt-8" style={{ borderColor: colors.border || colors.primary + '50' }}>
          <h2 className="text-2xl font-semibold mb-4 neon-glow" style={{ 
            color: colors.primary,
            fontFamily: typography.headingFont,
          }}>
            Our Mission
          </h2>
          <p className="text-lg leading-relaxed">
            Our mission is to deliver exceptional value to our customers through quality products,
            outstanding customer service, and a seamless shopping experience powered by innovation.
          </p>
        </div>

        <div className="border-t pt-8" style={{ borderColor: colors.border || colors.primary + '50' }}>
          <h2 className="text-2xl font-semibold mb-4 neon-glow" style={{ 
            color: colors.primary,
            fontFamily: typography.headingFont,
          }}>
            Why Choose Us
          </h2>
          <ul className="list-disc pl-6 space-y-3 text-lg">
            <li>Quality products at competitive prices</li>
            <li>Fast and reliable shipping</li>
            <li>Excellent customer support</li>
            <li>Secure payment processing</li>
            <li>Futuristic shopping experience</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
