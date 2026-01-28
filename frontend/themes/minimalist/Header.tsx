'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { Search, ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useCart } from '@/contexts/CartContext';
import '../minimalist/styles.css';

interface HeaderProps {
  storeSlug: string;
  storeName: string;
  onCartClick?: () => void;
}

export default function Header({ storeSlug, storeName, onCartClick }: HeaderProps) {
  const { colors, typography } = useStoreTheme();
  const { getTotalItems } = useCartStore();
  const { openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCartClick = () => {
    openCart();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/storefront/${storeSlug}?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header
      className="sticky top-0 z-50 border-b minimalist-fade"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border || colors.primary + '10',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link
            href={`/storefront/${storeSlug}`}
            className="text-xl font-medium minimalist-hover"
            style={{ color: colors.primary }}
          >
            {storeName}
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href={`/storefront/${storeSlug}`}
              className="text-sm minimalist-hover"
              style={{ color: colors.text }}
            >
              Home
            </Link>
            <Link
              href={`/storefront/${storeSlug}?category=all`}
              className="text-sm minimalist-hover"
              style={{ color: colors.text }}
            >
              Products
            </Link>
            <Link
              href={`/storefront/${storeSlug}/about`}
              className="text-sm minimalist-hover"
              style={{ color: colors.text }}
            >
              About
            </Link>
            <Link
              href={`/storefront/${storeSlug}/contact`}
              className="text-sm minimalist-hover"
              style={{ color: colors.text }}
            >
              Contact
            </Link>
          </nav>

          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: colors.text + '60' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border-b minimalist-input"
                style={{
                  borderColor: colors.border || colors.primary + '20',
                  color: colors.text,
                  backgroundColor: 'transparent',
                }}
              />
            </div>
          </form>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={handleCartClick}
              className="relative p-2 minimalist-hover cursor-pointer"
              style={{ color: colors.primary }}
              aria-label="Open cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {getTotalItems() > 0 && (
                <span
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-xs font-medium text-white"
                  style={{ backgroundColor: colors.accent }}
                >
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 minimalist-hover"
            style={{ color: colors.primary }}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            className="md:hidden py-4 border-t minimalist-fade"
            style={{
              borderColor: colors.border || colors.primary + '10',
            }}
          >
            <nav className="space-y-3 mb-4">
              <Link
                href={`/storefront/${storeSlug}`}
                className="block py-2 text-sm minimalist-hover"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href={`/storefront/${storeSlug}?category=all`}
                className="block py-2 text-sm minimalist-hover"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href={`/storefront/${storeSlug}/about`}
                className="block py-2 text-sm minimalist-hover"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href={`/storefront/${storeSlug}/contact`}
                className="block py-2 text-sm minimalist-hover"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: colors.text + '60' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border-b minimalist-input"
                  style={{
                    borderColor: colors.border || colors.primary + '20',
                    color: colors.text,
                    backgroundColor: 'transparent',
                  }}
                />
              </div>
            </form>
            <button
              onClick={handleCartClick}
              className="w-full flex items-center justify-between p-3 minimalist-hover"
              style={{ color: colors.primary }}
            >
              <span className="flex items-center gap-2 text-sm">
                <ShoppingCart className="h-4 w-4" />
                Cart
              </span>
              {getTotalItems() > 0 && (
                <span
                  className="h-4 w-4 rounded-full flex items-center justify-center text-xs font-medium text-white"
                  style={{ backgroundColor: colors.accent }}
                >
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
