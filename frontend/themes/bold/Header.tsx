'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { Search, ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useCart } from '@/contexts/CartContext';
import '../bold/styles.css';

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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      className={`sticky top-0 z-50 border-b-4 transition-all duration-300 slide-in-bold ${scrolled ? 'bg-white shadow-lg' : 'bg-white'}`}
      style={{
        borderColor: colors.primary,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link
            href={`/storefront/${storeSlug}`}
            className="text-3xl font-black tracking-tight bold-hover"
            style={{ 
              color: colors.primary,
              fontFamily: typography.headingFont,
            }}
          >
            {storeName}
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href={`/storefront/${storeSlug}`}
              className="text-sm font-bold uppercase tracking-wider bold-hover"
              style={{ color: colors.text }}
            >
              Home
            </Link>
            <Link
              href={`/storefront/${storeSlug}?category=all`}
              className="text-sm font-bold uppercase tracking-wider bold-hover"
              style={{ color: colors.text }}
            >
              Products
            </Link>
            <Link
              href={`/storefront/${storeSlug}/about`}
              className="text-sm font-bold uppercase tracking-wider bold-hover"
              style={{ color: colors.text }}
            >
              About
            </Link>
            <Link
              href={`/storefront/${storeSlug}/contact`}
              className="text-sm font-bold uppercase tracking-wider bold-hover"
              style={{ color: colors.text }}
            >
              Contact
            </Link>
          </nav>

          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: colors.primary }} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border-2 bold-input font-semibold"
                style={{
                  borderColor: colors.border || colors.primary,
                  color: colors.text,
                  backgroundColor: colors.secondary,
                }}
              />
            </div>
          </form>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={handleCartClick}
              className="relative p-3 rounded-lg bold-button cursor-pointer border-2"
              style={{ 
                color: colors.accent,
                borderColor: colors.accent,
                backgroundColor: colors.secondary,
              }}
              aria-label="Open cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {getTotalItems() > 0 && (
                <span
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-black text-white bold-pulse"
                  style={{ 
                    backgroundColor: colors.primary,
                  }}
                >
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 bold-hover"
            style={{ color: colors.primary }}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            className="md:hidden py-4 border-t-2 slide-in-bold"
            style={{
              borderColor: colors.primary,
            }}
          >
            <nav className="space-y-3 mb-4">
              <Link
                href={`/storefront/${storeSlug}`}
                className="block py-2 text-sm font-bold uppercase tracking-wider"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href={`/storefront/${storeSlug}?category=all`}
                className="block py-2 text-sm font-bold uppercase tracking-wider"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href={`/storefront/${storeSlug}/about`}
                className="block py-2 text-sm font-bold uppercase tracking-wider"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href={`/storefront/${storeSlug}/contact`}
                className="block py-2 text-sm font-bold uppercase tracking-wider"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: colors.primary }} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border-2 bold-input font-semibold"
                  style={{
                    borderColor: colors.border || colors.primary,
                    color: colors.text,
                    backgroundColor: colors.secondary,
                  }}
                />
              </div>
            </form>
            <button
              onClick={handleCartClick}
              className="w-full flex items-center justify-between p-3 rounded-lg bold-button border-2"
              style={{ 
                color: colors.accent,
                borderColor: colors.accent,
              }}
            >
              <span className="flex items-center gap-2 font-bold">
                <ShoppingCart className="h-5 w-5" />
                Cart
              </span>
              {getTotalItems() > 0 && (
                <span
                  className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-black text-white bold-pulse"
                  style={{ 
                    backgroundColor: colors.primary,
                  }}
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
