'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import Link from 'next/link';
import './styles.css';

interface FooterProps {
  storeSlug: string;
  storeName: string;
}

export default function Footer({ storeSlug, storeName }: FooterProps) {
  const { colors, typography } = useStoreTheme();

  return (
    <footer
      className="border-t mt-16"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border || colors.primary + '30',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: colors.primary }}
            >
              {storeName}
            </h3>
            <p className="text-sm relative z-10" style={{ color: '#e0e7ff', opacity: 0.8 }}>
              Premium cosmic space theme store
            </p>
          </div>

          <div>
            <h4
              className="text-sm font-semibold mb-4 uppercase tracking-wide"
              style={{ color: colors.primary }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={`https://${storeSlug}.eazyds.com`}
                  className="text-sm hover:opacity-100 transition-all duration-300 hover:translate-x-1 relative z-10"
                  style={{ color: '#e0e7ff', opacity: 0.8 }}
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href={`https://${storeSlug}.eazyds.com?category=all`}
                  className="text-sm hover:opacity-100 transition-all duration-300 hover:translate-x-1 relative z-10"
                  style={{ color: '#e0e7ff', opacity: 0.8 }}
                >
                  All Products
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4
              className="text-sm font-semibold mb-4 uppercase tracking-wide"
              style={{ color: colors.primary }}
            >
              Customer Service
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={`https://${storeSlug}.eazyds.com/contact`}
                  className="text-sm hover:opacity-100 transition-all duration-300 hover:translate-x-1 relative z-10"
                  style={{ color: '#e0e7ff', opacity: 0.8 }}
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href={`https://${storeSlug}.eazyds.com/about`}
                  className="text-sm hover:opacity-100 transition-all duration-300 hover:translate-x-1 relative z-10"
                  style={{ color: '#e0e7ff', opacity: 0.8 }}
                >
                  About Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4
              className="text-sm font-semibold mb-4 uppercase tracking-wide"
              style={{ color: colors.primary }}
            >
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm hover:opacity-100 transition-all duration-300 hover:translate-x-1 relative z-10"
                  style={{ color: '#e0e7ff', opacity: 0.8 }}
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm hover:opacity-100 transition-all duration-300 hover:translate-x-1 relative z-10"
                  style={{ color: '#e0e7ff', opacity: 0.8 }}
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-8 pt-8 border-t text-center text-sm"
          style={{
            borderColor: colors.border || colors.primary + '30',
            color: colors.text + '99',
          }}
        >
          <p className="relative z-10" style={{ color: '#e0e7ff', opacity: 0.7 }}>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
