'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { Search, ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useCart } from '@/contexts/CartContext';
import './styles.css';

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
      window.location.href = `https://${storeSlug}.eazyds.com?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header
      className="sticky top-0 z-[100] border-b backdrop-blur-xl"
      style={{
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        borderColor: 'rgba(167, 139, 250, 0.3)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.2)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href={`https://${storeSlug}.eazyds.com`}
            className="text-2xl font-bold tracking-tight"
            style={{ color: colors.primary }}
          >
            {storeName}
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: colors.text + '80' }} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all relative z-10"
                style={{
                  backgroundColor: 'rgba(30, 27, 75, 0.7)',
                  borderColor: 'rgba(167, 139, 250, 0.4)',
                  color: '#e0e7ff',
                }}
              />
            </div>
          </form>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={handleCartClick}
              className="relative p-2 rounded-lg transition-all duration-300 cursor-pointer hover:scale-110 hover:rotate-3 z-10"
              style={{ 
                color: colors.primary,
                backgroundColor: 'rgba(30, 27, 75, 0.6)',
              }}
              aria-label="Open cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {getTotalItems() > 0 && (
                <span
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: colors.accent }}
                >
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            style={{ color: colors.primary }}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            className="md:hidden py-4 border-t"
            style={{
              borderColor: colors.border || colors.primary + '30',
            }}
          >
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: colors.text + '80' }} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border relative z-10"
                  style={{
                    backgroundColor: 'rgba(30, 27, 75, 0.7)',
                    borderColor: 'rgba(167, 139, 250, 0.4)',
                    color: '#e0e7ff',
                  }}
                />
              </div>
            </form>
            <button
              onClick={handleCartClick}
              className="w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 hover:scale-[1.02] relative z-10"
              style={{ color: colors.primary, backgroundColor: 'rgba(30, 27, 75, 0.8)' }}
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart
              </span>
              {getTotalItems() > 0 && (
                <span
                  className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
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
