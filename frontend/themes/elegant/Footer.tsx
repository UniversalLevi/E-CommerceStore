'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import Link from 'next/link';
import '../elegant/styles.css';

interface FooterProps {
  storeSlug: string;
  storeName: string;
}

export default function Footer({ storeSlug, storeName }: FooterProps) {
  const { colors, typography } = useStoreTheme();

  return (
    <footer
      className="border-t mt-16 elegant-fade-in"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border || colors.accent + '30',
        borderTopWidth: '2px',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3
              className="text-2xl font-bold mb-4"
              style={{ 
                color: colors.primary,
                fontFamily: typography.headingFont,
              }}
            >
              {storeName}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: colors.text + 'CC' }}>
              Luxury shopping experience with premium products
            </p>
          </div>

          <div>
            <h4
              className="text-sm font-semibold mb-6 uppercase tracking-wider"
              style={{ color: colors.accent }}
            >
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`/storefront/${storeSlug}`}
                  className="text-sm elegant-hover"
                  style={{ color: colors.text + 'CC' }}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href={`/storefront/${storeSlug}?category=all`}
                  className="text-sm elegant-hover"
                  style={{ color: colors.text + 'CC' }}
                >
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4
              className="text-sm font-semibold mb-6 uppercase tracking-wider"
              style={{ color: colors.accent }}
            >
              Customer Service
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`/storefront/${storeSlug}/contact`}
                  className="text-sm elegant-hover"
                  style={{ color: colors.text + 'CC' }}
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href={`/storefront/${storeSlug}/about`}
                  className="text-sm elegant-hover"
                  style={{ color: colors.text + 'CC' }}
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4
              className="text-sm font-semibold mb-6 uppercase tracking-wider"
              style={{ color: colors.accent }}
            >
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-sm elegant-hover"
                  style={{ color: colors.text + 'CC' }}
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm elegant-hover"
                  style={{ color: colors.text + 'CC' }}
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-12 pt-8 border-t text-center text-sm"
          style={{
            borderColor: colors.border || colors.accent + '30',
            color: colors.text + '99',
          }}
        >
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
