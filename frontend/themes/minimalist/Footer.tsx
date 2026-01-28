'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import Link from 'next/link';
import '../minimalist/styles.css';

interface FooterProps {
  storeSlug: string;
  storeName: string;
}

export default function Footer({ storeSlug, storeName }: FooterProps) {
  const { colors } = useStoreTheme();

  return (
    <footer
      className="border-t mt-24 minimalist-fade"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border || colors.primary + '10',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3
              className="text-sm font-medium mb-4"
              style={{ color: colors.primary }}
            >
              {storeName}
            </h3>
            <p className="text-xs" style={{ color: colors.text + '80' }}>
              Clean shopping experience
            </p>
          </div>

          <div>
            <h4
              className="text-xs font-medium mb-4"
              style={{ color: colors.text }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/storefront/${storeSlug}`}
                  className="text-xs minimalist-hover"
                  style={{ color: colors.text + '80' }}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href={`/storefront/${storeSlug}?category=all`}
                  className="text-xs minimalist-hover"
                  style={{ color: colors.text + '80' }}
                >
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4
              className="text-xs font-medium mb-4"
              style={{ color: colors.text }}
            >
              Customer Service
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/storefront/${storeSlug}/contact`}
                  className="text-xs minimalist-hover"
                  style={{ color: colors.text + '80' }}
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href={`/storefront/${storeSlug}/about`}
                  className="text-xs minimalist-hover"
                  style={{ color: colors.text + '80' }}
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4
              className="text-xs font-medium mb-4"
              style={{ color: colors.text }}
            >
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-xs minimalist-hover"
                  style={{ color: colors.text + '80' }}
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-xs minimalist-hover"
                  style={{ color: colors.text + '80' }}
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-12 pt-8 border-t text-center text-xs"
          style={{
            borderColor: colors.border || colors.primary + '10',
            color: colors.text + '60',
          }}
        >
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
