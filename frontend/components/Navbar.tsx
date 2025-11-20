'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700 shadow-lg sticky top-0 z-50" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center gap-4">
          <Link 
            href="/" 
            className="text-xl md:text-2xl font-bold text-primary-400 hover:text-primary-300 transition-colors"
            aria-label="Home"
          >
            Auto Shopify Store Builder
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products and niches..."
              className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-400"
              aria-label="Search products and niches"
            />
          </form>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link
                  href="/products"
                  className="text-gray-300 hover:text-primary-400 transition-colors"
                  aria-label="Browse Products"
                >
                  Products
                </Link>
                <Link
                  href="/dashboard"
                  className="text-gray-300 hover:text-primary-400 transition-colors"
                  aria-label="Dashboard"
                >
                  Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/products"
                    className="text-gray-300 hover:text-primary-400 transition-colors"
                    aria-label="Admin Panel"
                  >
                    Admin
                  </Link>
                )}
                <NotificationBell />
                <span className="text-gray-400 text-sm" aria-label={`Logged in as ${user?.email}`}>
                  {user?.email}
                </span>
                <button
                  onClick={logout}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm min-h-[44px] min-w-[80px]"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/products"
                  className="text-gray-300 hover:text-primary-400 transition-colors"
                  aria-label="Browse Products"
                >
                  Products
                </Link>
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-primary-400 transition-colors"
                  aria-label="Login"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors min-h-[44px] flex items-center"
                  aria-label="Sign Up"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-primary-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-700">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mt-4 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products and niches..."
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-400 min-h-[44px]"
                aria-label="Search products and niches"
              />
            </form>

            <div className="flex flex-col gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/products"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-300 hover:text-primary-400 transition-colors py-2"
                    aria-label="Browse Products"
                  >
                    Products
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-300 hover:text-primary-400 transition-colors py-2"
                    aria-label="Dashboard"
                  >
                    Dashboard
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      href="/admin/products"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-gray-300 hover:text-primary-400 transition-colors py-2"
                      aria-label="Admin Panel"
                    >
                      Admin
                    </Link>
                  )}
                  <div className="flex items-center gap-2 py-2">
                    <NotificationBell />
                    <span className="text-gray-400 text-sm">{user?.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm text-left min-h-[44px]"
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/products"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-300 hover:text-primary-400 transition-colors py-2 min-h-[44px] flex items-center"
                    aria-label="Browse Products"
                  >
                    Products
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-300 hover:text-primary-400 transition-colors py-2 min-h-[44px] flex items-center"
                    aria-label="Login"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
                    aria-label="Sign Up"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

