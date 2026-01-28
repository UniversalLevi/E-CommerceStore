'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { Search, ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useCart } from '@/contexts/CartContext';
import '../neon/styles.css';

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
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${scrolled ? 'bg-black/95 backdrop-blur-md' : 'bg-black/80 backdrop-blur-sm'}`}
      style={{
        borderColor: colors.border || colors.primary,
        boxShadow: scrolled ? `0 0 20px ${colors.primary}40` : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href={`/storefront/${storeSlug}`}
            className="text-2xl font-bold tracking-tight neon-glow slide-in-left"
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
              className="text-sm font-semibold hover:neon-glow transition-all"
              style={{ color: colors.text }}
            >
              Home
            </Link>
            <Link
              href={`/storefront/${storeSlug}?category=all`}
              className="text-sm font-semibold hover:neon-glow transition-all"
              style={{ color: colors.text }}
            >
              Products
            </Link>
            <Link
              href={`/storefront/${storeSlug}/about`}
              className="text-sm font-semibold hover:neon-glow transition-all"
              style={{ color: colors.text }}
            >
              About
            </Link>
            <Link
              href={`/storefront/${storeSlug}/contact`}
              className="text-sm font-semibold hover:neon-glow transition-all"
              style={{ color: colors.text }}
            >
              Contact
            </Link>
          </nav>

          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: colors.primary }} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border neon-input bg-black/50"
                style={{
                  borderColor: colors.border || colors.primary + '50',
                  color: colors.text,
                }}
              />
            </div>
          </form>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={handleCartClick}
              className="relative p-2 rounded-lg neon-hover-glow transition-all cursor-pointer"
              style={{ 
                color: colors.primary,
              }}
              aria-label="Open cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {getTotalItems() > 0 && (
                <span
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold neon-pulse"
                  style={{ 
                    backgroundColor: colors.accent,
                    color: '#000',
                    boxShadow: `0 0 10px ${colors.accent}`,
                  }}
                >
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 neon-hover-glow"
            style={{ color: colors.primary }}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            className="md:hidden py-4 border-t slide-up"
            style={{
              borderColor: colors.border || colors.primary + '50',
            }}
          >
            <nav className="space-y-3 mb-4">
              <Link
                href={`/storefront/${storeSlug}`}
                className="block py-2 text-sm font-semibold"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href={`/storefront/${storeSlug}?category=all`}
                className="block py-2 text-sm font-semibold"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href={`/storefront/${storeSlug}/about`}
                className="block py-2 text-sm font-semibold"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href={`/storefront/${storeSlug}/contact`}
                className="block py-2 text-sm font-semibold"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: colors.primary }} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border neon-input bg-black/50"
                  style={{
                    borderColor: colors.border || colors.primary + '50',
                    color: colors.text,
                  }}
                />
              </div>
            </form>
            <button
              onClick={handleCartClick}
              className="w-full flex items-center justify-between p-3 rounded-lg neon-hover-glow transition-all"
              style={{ color: colors.primary, border: `1px solid ${colors.border || colors.primary}50` }}
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart
              </span>
              {getTotalItems() > 0 && (
                <span
                  className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold neon-pulse"
                  style={{ 
                    backgroundColor: colors.accent,
                    color: '#000',
                    boxShadow: `0 0 10px ${colors.accent}`,
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
