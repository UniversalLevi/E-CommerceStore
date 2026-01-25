'use client';

import { useStoreTheme } from '@/contexts/StoreThemeContext';
import Link from 'next/link';

interface FooterProps {
  storeSlug: string;
  storeName: string;
}

export default function Footer({ storeSlug, storeName }: FooterProps) {
  const { colors, typography } = useStoreTheme();

  return (
    <footer
      className="border-t mt-20"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.accent + '30',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3
              className="text-2xl font-serif mb-4 tracking-wider"
              style={{ color: colors.primary, fontFamily: typography.headingFont }}
            >
              {storeName}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: colors.text + 'CC' }}>
              Luxury products for the discerning customer
            </p>
          </div>
          <div>
            <h4
              className="text-sm font-semibold mb-4 uppercase tracking-widest"
              style={{ color: colors.primary }}
            >
              Shop
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`/storefront/${storeSlug}`}
                  className="text-sm hover:opacity-80 transition-opacity"
                  style={{ color: colors.text + 'CC' }}
                >
                  All Products
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4
              className="text-sm font-semibold mb-4 uppercase tracking-widest"
              style={{ color: colors.primary }}
            >
              Customer Care
            </h4>
            <ul className="space-y-3">
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
              className="text-sm font-semibold mb-4 uppercase tracking-widest"
              style={{ color: colors.primary }}
            >
              Legal
            </h4>
            <ul className="space-y-3">
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
          className="mt-12 pt-8 border-t text-center text-sm"
          style={{
            borderColor: colors.accent + '30',
            color: colors.text + '99',
          }}
        >
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
