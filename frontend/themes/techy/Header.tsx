'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { Search, ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useCart } from '@/contexts/CartContext';

interface HeaderProps {
  storeSlug: string;
  storeName: string;
  onCartClick: () => void;
}

export default function Header({ storeSlug, storeName, onCartClick }: HeaderProps) {
  const { colors, typography } = useStoreTheme();
  const { getTotalItems } = useCartStore();
  const { openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCartClick = () => {
    // Only use the context method, don't call onCartClick to avoid double opening
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
      className="sticky top-0 z-50 border-b-2"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.accent,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href={`/storefront/${storeSlug}`}
            className="text-2xl font-bold tracking-tighter"
            style={{ color: colors.accent, fontFamily: typography.fontFamily }}
          >
            {'>'} {storeName}
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: colors.accent }} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 bg-transparent"
                style={{
                  borderColor: colors.accent,
                  color: colors.text,
                  fontFamily: typography.fontFamily,
                }}
              />
            </div>
          </form>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={handleCartClick}
              className="relative p-2 border-2 hover:opacity-80 transition-opacity cursor-pointer"
              style={{ borderColor: colors.accent, color: colors.accent }}
              aria-label="Open cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {getTotalItems() > 0 && (
                <span
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: colors.accent, color: colors.background }}
                >
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            style={{ color: colors.accent }}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            className="md:hidden py-4 border-t-2"
            style={{
              borderColor: colors.accent,
            }}
          >
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: colors.accent }} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 bg-transparent"
                  style={{
                    borderColor: colors.accent,
                    color: colors.text,
                  }}
                />
              </div>
            </form>
            <button
              onClick={handleCartClick}
              className="w-full flex items-center justify-between p-3 border-2 hover:opacity-80 transition-opacity cursor-pointer"
              style={{ borderColor: colors.accent, color: colors.accent }}
              aria-label="Open cart"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart
              </span>
              {getTotalItems() > 0 && (
                <span
                  className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: colors.accent, color: colors.background }}
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
