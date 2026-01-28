'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { Search, ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useCart } from '@/contexts/CartContext';
import '../elegant/styles.css';

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
      className={`sticky top-0 z-50 border-b transition-all duration-300 elegant-fade-in ${scrolled ? 'bg-white/98 backdrop-blur-md shadow-lg' : 'bg-white/95 backdrop-blur-sm'}`}
      style={{
        borderColor: colors.border || colors.accent + '30',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link
            href={`/storefront/${storeSlug}`}
            className="text-3xl font-bold tracking-wide elegant-hover"
            style={{ 
              color: colors.primary,
              fontFamily: typography.headingFont,
            }}
          >
            {storeName}
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href={`/storefront/${storeSlug}`}
              className="text-sm font-semibold uppercase tracking-wider elegant-hover"
              style={{ color: colors.text }}
            >
              Home
            </Link>
            <Link
              href={`/storefront/${storeSlug}?category=all`}
              className="text-sm font-semibold uppercase tracking-wider elegant-hover"
              style={{ color: colors.text }}
            >
              Products
            </Link>
            <Link
              href={`/storefront/${storeSlug}/about`}
              className="text-sm font-semibold uppercase tracking-wider elegant-hover"
              style={{ color: colors.text }}
            >
              About
            </Link>
            <Link
              href={`/storefront/${storeSlug}/contact`}
              className="text-sm font-semibold uppercase tracking-wider elegant-hover"
              style={{ color: colors.text }}
            >
              Contact
            </Link>
          </nav>

          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: colors.accent }} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border elegant-input bg-cream/50"
                style={{
                  borderColor: colors.border || colors.accent + '30',
                  color: colors.text,
                  backgroundColor: colors.secondary + '50',
                }}
              />
            </div>
          </form>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={handleCartClick}
              className="relative p-3 rounded-lg elegant-hover transition-all cursor-pointer border-2"
              style={{ 
                color: colors.accent,
                borderColor: colors.accent + '30',
              }}
              aria-label="Open cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {getTotalItems() > 0 && (
                <span
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ 
                    backgroundColor: colors.accent,
                    boxShadow: `0 0 10px ${colors.accent}50`,
                  }}
                >
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 elegant-hover"
            style={{ color: colors.accent }}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            className="md:hidden py-4 border-t elegant-fade-in"
            style={{
              borderColor: colors.border || colors.accent + '30',
            }}
          >
            <nav className="space-y-3 mb-4">
              <Link
                href={`/storefront/${storeSlug}`}
                className="block py-2 text-sm font-semibold uppercase tracking-wider"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href={`/storefront/${storeSlug}?category=all`}
                className="block py-2 text-sm font-semibold uppercase tracking-wider"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href={`/storefront/${storeSlug}/about`}
                className="block py-2 text-sm font-semibold uppercase tracking-wider"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href={`/storefront/${storeSlug}/contact`}
                className="block py-2 text-sm font-semibold uppercase tracking-wider"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: colors.accent }} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border elegant-input"
                  style={{
                    borderColor: colors.border || colors.accent + '30',
                    color: colors.text,
                    backgroundColor: colors.secondary + '50',
                  }}
                />
              </div>
            </form>
            <button
              onClick={handleCartClick}
              className="w-full flex items-center justify-between p-3 rounded-lg elegant-hover border-2"
              style={{ 
                color: colors.accent, 
                borderColor: colors.accent + '30',
              }}
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart
              </span>
              {getTotalItems() > 0 && (
                <span
                  className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ 
                    backgroundColor: colors.accent,
                    boxShadow: `0 0 10px ${colors.accent}50`,
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
