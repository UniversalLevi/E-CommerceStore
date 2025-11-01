'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';

interface ConnectedStore {
  _id: string;
  storeName: string;
  platform: string;
  storeDomain: string;
  status: string;
  lastActivityAt?: string;
  lastSyncAt?: string;
  tokenExpiresAt?: string;
  createdAt: string;
}

export default function ConnectedStoresPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<ConnectedStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectingShopify, setConnectingShopify] = useState(false);
  const [shopDomain, setShopDomain] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConnectedStores();
    }
  }, [isAuthenticated]);

  const fetchConnectedStores = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: ConnectedStore[] }>(
        '/api/connected-stores'
      );
      setStores(response.data);
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      setError(error.response?.data?.error || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectShopify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopDomain.trim()) {
      setError('Please enter your Shopify store domain');
      return;
    }

    setConnectingShopify(true);
    setError('');

    try {
      const response = await api.get<{ success: boolean; authUrl: string }>(
        `/api/connected-stores/shopify/connect?shop=${shopDomain.trim()}`
      );

      if (response.authUrl) {
        // Redirect to Shopify OAuth page
        window.location.href = response.authUrl;
      }
    } catch (error: any) {
      console.error('Error connecting Shopify:', error);
      setError(error.response?.data?.error || 'Failed to connect Shopify');
      setConnectingShopify(false);
    }
  };

  const handleDisconnect = async (storeId: string, storeName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${storeName}?`)) {
      return;
    }

    try {
      await api.delete(`/api/connected-stores/${storeId}/disconnect`);
      setStores(stores.filter(s => s._id !== storeId));
      alert('Store disconnected successfully');
    } catch (error: any) {
      console.error('Error disconnecting store:', error);
      setError(error.response?.data?.error || 'Failed to disconnect store');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      connected: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      revoked: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
          statusColors[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      shopify: '🛍️',
      woocommerce: '🛒',
      etsy: '🎨',
    };
    return icons[platform] || '🏪';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Connected Stores</h1>
            <p className="mt-2 text-gray-600">
              Manage your connected e-commerce platforms
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Connect New Store */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Connect a New Store
            </h2>
            
            <form onSubmit={handleConnectShopify} className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shopify Store Domain
                </label>
                <input
                  type="text"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  placeholder="mystore.myshopify.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={connectingShopify}
                />
              </div>
              
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={connectingShopify}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connectingShopify ? 'Connecting...' : 'Connect Shopify'}
                </button>
              </div>
            </form>
          </div>

          {/* Connected Stores List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Connected Stores ({stores.length})
            </h2>

            {stores.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🏪</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No stores connected yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Connect your first store to start managing products
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {stores.map((store) => (
                  <div
                    key={store._id}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-4xl">
                          {getPlatformIcon(store.platform)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {store.storeName}
                            </h3>
                            {getStatusBadge(store.status)}
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">Domain:</span>{' '}
                              <a
                                href={`https://${store.storeDomain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:underline"
                              >
                                {store.storeDomain}
                              </a>
                            </p>
                            <p>
                              <span className="font-medium">Platform:</span>{' '}
                              {store.platform.charAt(0).toUpperCase() + store.platform.slice(1)}
                            </p>
                            {store.lastActivityAt && (
                              <p>
                                <span className="font-medium">Last Activity:</span>{' '}
                                {new Date(store.lastActivityAt).toLocaleString()}
                              </p>
                            )}
                            <p>
                              <span className="font-medium">Connected:</span>{' '}
                              {new Date(store.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {store.status === 'connected' && (
                          <button
                            onClick={() => router.push(`/products?store=${store._id}`)}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Use Store
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDisconnect(store._id, store.storeName)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

