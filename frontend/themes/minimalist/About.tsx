'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import '../minimalist/styles.css';

interface AboutProps {
  storeSlug: string;
  storeName: string;
}

export default function About({ storeSlug, storeName }: AboutProps) {
  const { colors } = useStoreTheme();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 minimalist-fade">
      <h1 className="text-3xl font-medium mb-12" style={{ color: colors.primary }}>
        About {storeName}
      </h1>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: colors.text + '80' }}>
        <p>
          Welcome to {storeName}, your trusted destination for quality products and exceptional service.
        </p>
        <p>
          We are committed to providing you with the best shopping experience, offering a wide selection
          of products at competitive prices.
        </p>
        
        <div className="border-t pt-8" style={{ borderColor: colors.border || colors.primary + '10' }}>
          <h2 className="text-xl font-medium mb-4" style={{ color: colors.primary }}>
            Our Mission
          </h2>
          <p>
            Our mission is to deliver exceptional value to our customers through quality products,
            outstanding customer service, and a seamless shopping experience.
          </p>
        </div>

        <div className="border-t pt-8" style={{ borderColor: colors.border || colors.primary + '10' }}>
          <h2 className="text-xl font-medium mb-4" style={{ color: colors.primary }}>
            Why Choose Us
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Quality products at competitive prices</li>
            <li>Fast and reliable shipping</li>
            <li>Excellent customer support</li>
            <li>Secure payment processing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
