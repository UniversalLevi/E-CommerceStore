'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import Link from 'next/link';

interface FooterProps {
  storeSlug: string;
  storeName: string;
}

export default function Footer({ storeSlug, storeName }: FooterProps) {
  const { colors } = useStoreTheme();

  return (
    <footer
      className="border-t mt-16"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.primary + '30',
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
            <p className="text-sm" style={{ color: colors.text + 'CC' }}>
              Your trusted online store
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
                <Link
                  href={`/storefront/${storeSlug}`}
                  className="text-sm hover:opacity-80 transition-opacity"
                  style={{ color: colors.text + 'CC' }}
                >
                  Home
                </Link>
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
                  href="#"
                  className="text-sm hover:opacity-80 transition-opacity"
                  style={{ color: colors.text + 'CC' }}
                >
                  Contact Us
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
                  className="text-sm hover:opacity-80 transition-opacity"
                  style={{ color: colors.text + 'CC' }}
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div
          className="mt-8 pt-8 border-t text-center text-sm"
          style={{
            borderColor: colors.primary + '30',
            color: colors.text + '99',
          }}
        >
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
