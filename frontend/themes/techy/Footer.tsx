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
      className="border-t-2 mt-16"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.accent,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3
              className="text-lg font-bold mb-4"
              style={{ color: colors.accent, fontFamily: typography.fontFamily }}
            >
              {'>'} {storeName}
            </h3>
            <p className="text-sm" style={{ color: colors.text + 'CC', fontFamily: typography.fontFamily }}>
              Tech products for the future
            </p>
          </div>
          <div>
            <h4
              className="text-sm font-bold mb-4 uppercase"
              style={{ color: colors.accent }}
            >
              Links
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
              className="text-sm font-bold mb-4 uppercase"
              style={{ color: colors.accent }}
            >
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm hover:opacity-80 transition-opacity"
                  style={{ color: colors.text + 'CC' }}
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4
              className="text-sm font-bold mb-4 uppercase"
              style={{ color: colors.accent }}
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
                  Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div
          className="mt-8 pt-8 border-t-2 text-center text-sm"
          style={{
            borderColor: colors.accent,
            color: colors.text + '99',
          }}
        >
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
