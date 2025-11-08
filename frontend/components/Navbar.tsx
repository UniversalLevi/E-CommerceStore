'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="bg-gray-800 border-b border-gray-700 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-400 hover:text-primary-300 transition-colors">
            Auto Shopify Store Builder
          </Link>

          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link
                  href="/products"
                  className="text-gray-300 hover:text-primary-400 transition-colors"
                >
                  Products
                </Link>
                <Link
                  href="/dashboard"
                  className="text-gray-300 hover:text-primary-400 transition-colors"
                >
                  Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/products"
                    className="text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <span className="text-gray-400 text-sm">{user?.email}</span>
                <button
                  onClick={logout}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/products"
                  className="text-gray-300 hover:text-primary-400 transition-colors"
                >
                  Products
                </Link>
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-primary-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

