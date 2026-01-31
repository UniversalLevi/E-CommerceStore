'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import './styles.css';

interface AboutProps {
  storeSlug: string;
  storeName: string;
}

export default function About({ storeSlug, storeName }: AboutProps) {
  const { colors } = useStoreTheme();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
      <h1 className="text-4xl font-bold mb-8 animate-slideIn" style={{ 
        color: colors.primary,
        textShadow: '0 2px 20px rgba(255, 255, 255, 0.1)',
      }}>
        About {storeName}
      </h1>

      <div className="prose prose-lg max-w-none animate-fadeIn" style={{ 
        color: colors.text,
        opacity: 0.9,
      }}>
        <p className="mb-6">
          Welcome to {storeName}, your trusted destination for quality products and exceptional service.
        </p>
        <p className="mb-6">
          We are committed to providing you with the best shopping experience, offering a wide selection
          of products at competitive prices.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4" style={{ color: colors.primary }}>
          Our Mission
        </h2>
        <p className="mb-6">
          Our mission is to deliver exceptional value to our customers through quality products,
          outstanding customer service, and a seamless shopping experience.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4" style={{ color: colors.primary }}>
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
  );
}
