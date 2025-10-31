'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { User } from '@/types';

function ShopifyConnectionCard({ user }: { user: User }) {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [shopName, setShopName] = useState('');

  const handleConnect = async () => {
    if (!shopName.trim()) {
      alert('Please enter your Shopify store name');
      return;
    }

    setConnecting(true);
    try {
      // Get the token first
      const token = localStorage.getItem('token');
      // Redirect to backend OAuth initiation with token
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/shopify/auth?shop=${shopName}.myshopify.com&token=${token}`;
    } catch (error) {
      alert('Failed to connect to Shopify');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Shopify account?')) {
      return;
    }

    setDisconnecting(true);
    try {
      await api.post('/api/shopify/disconnect');
      window.location.reload();
    } catch (error) {
      alert('Failed to disconnect Shopify account');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold mb-4">Shopify Connection</h3>
      {user.shopifyShop ? (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">
              Connected to: <strong>{user.shopifyShop}</strong>
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect Account'}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-gray-700">Not connected</span>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shopify Store Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="your-store"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <span className="flex items-center text-gray-500 text-sm">
                .myshopify.com
              </span>
            </div>
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {connecting ? 'Connecting...' : 'Connect Shopify Account'}
          </button>
          <p className="mt-3 text-sm text-gray-500">
            💡 You'll be redirected to Shopify to authorize the connection
          </p>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading, logout, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Show notification if redirected from Shopify and refresh user data
  useEffect(() => {
    const shopifyStatus = searchParams.get('shopify');
    if (shopifyStatus === 'connected') {
      alert('✅ Shopify account connected successfully!');
      refreshUser(); // Refresh user data to get updated Shopify info
      router.replace('/dashboard');
    } else if (shopifyStatus === 'error') {
      alert('❌ Failed to connect Shopify account. Please try again.');
      router.replace('/dashboard');
    }
  }, [searchParams, router, refreshUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-600">
              Auto Shopify Store Builder
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user.email}</span>
              {user.role === 'admin' && (
                <Link
                  href="/admin/products"
                  className="text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={logout}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Welcome back, {user.email}!
          </h2>

          {/* Shopify Connection Status */}
          <ShopifyConnectionCard user={user} />

          {/* Stores */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Your Stores</h3>
            {user.stores && user.stores.length > 0 ? (
              <div className="space-y-4">
                {user.stores.map((store, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {store.productName || 'Store'}
                        </h4>
                        <a
                          href={store.storeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          {store.storeUrl}
                        </a>
                        <p className="text-sm text-gray-500 mt-1">
                          Created: {new Date(store.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={store.storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary-100 text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-200 transition-colors"
                      >
                        Visit Store
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  You haven't created any stores yet
                </p>
                <Link
                  href="/products"
                  className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/products"
                className="border-2 border-primary-200 hover:border-primary-400 rounded-lg p-4 transition-colors"
              >
                <div className="text-2xl mb-2">🛍️</div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Browse Products
                </h4>
                <p className="text-sm text-gray-600">
                  Find products to add to your store
                </p>
              </Link>

              <div className="border-2 border-gray-200 hover:border-gray-300 rounded-lg p-4 transition-colors cursor-pointer">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  View Analytics
                </h4>
                <p className="text-sm text-gray-600">
                  Track your store performance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

