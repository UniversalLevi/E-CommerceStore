'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import Link from 'next/link';
import '../vintage/styles.css';

interface FooterProps {
  storeSlug: string;
  storeName: string;
}

export default function Footer({ storeSlug, storeName }: FooterProps) {
  const { colors, typography } = useStoreTheme();

  return (
    <footer
      className="border-t-2 mt-16 vintage-fade vintage-paper"
      style={{
        borderColor: colors.border || colors.primary,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3
              className="text-lg font-bold mb-4"
              style={{ 
                color: colors.primary,
                fontFamily: typography.headingFont,
              }}
            >
              {storeName}
            </h3>
            <p className="text-sm" style={{ color: colors.text + 'CC' }}>
              Classic shopping experience
            </p>
          </div>

          <div>
            <h4
              className="text-sm font-semibold mb-4"
              style={{ color: colors.primary }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/storefront/${storeSlug}`}
                  className="text-sm vintage-hover"
                  style={{ color: colors.text + 'CC' }}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href={`/storefront/${storeSlug}?category=all`}
                  className="text-sm vintage-hover"
                  style={{ color: colors.text + 'CC' }}
                >
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4
              className="text-sm font-semibold mb-4"
              style={{ color: colors.primary }}
            >
              Customer Service
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/storefront/${storeSlug}/contact`}
                  className="text-sm vintage-hover"
                  style={{ color: colors.text + 'CC' }}
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href={`/storefront/${storeSlug}/about`}
                  className="text-sm vintage-hover"
                  style={{ color: colors.text + 'CC' }}
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4
              className="text-sm font-semibold mb-4"
              style={{ color: colors.primary }}
            >
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm vintage-hover"
                  style={{ color: colors.text + 'CC' }}
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm vintage-hover"
                  style={{ color: colors.text + 'CC' }}
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-8 pt-8 border-t-2 text-center text-sm"
          style={{
            borderColor: colors.border || colors.primary,
            color: colors.text + '99',
          }}
        >
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
