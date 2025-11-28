'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { notify } from '@/lib/toast';
import IconBadge from '@/components/IconBadge';

interface UserProduct extends Product {
  stores: Array<{
    storeUrl: string;
    addedAt: string;
  }>;
  addedAt: string;
}

export default function StoreProductsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStore, setLoadingStore] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && params.id) {
      fetchStore();
    }
  }, [isAuthenticated, params.id]);

  useEffect(() => {
    if (store) {
      fetchProducts();
    }
  }, [store]);

  const fetchStore = async () => {
    try {
      setLoadingStore(true);
      const response = await api.get<{ success: boolean; data: any }>(
        `/api/stores/${params.id}`
      );
      setStore(response.data);
    } catch (err: any) {
      setError('Failed to load store');
      notify.error('Failed to load store');
    } finally {
      setLoadingStore(false);
    }
  };

  const fetchProducts = async () => {
    if (!store?.storeUrl) return;

    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: UserProduct[] }>(
        `/api/products/user?storeUrl=${encodeURIComponent(store.storeUrl)}`
      );
      setProducts(response.data);
    } catch (err: any) {
      setError('Failed to load products');
      notify.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.title.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      (typeof product.niche === 'object' && product.niche?.name.toLowerCase().includes(query))
    );
  });

  if (authLoading || loadingStore) {
    return (
      <div className="min-h-screen bg-surface-base">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !store) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/dashboard/stores/${params.id}`}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Back to Store Details
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Products in {store.storeName}
            </h1>
            <p className="text-gray-600">{store.shopDomain}</p>
          </div>
          <Link
            href="/products"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Add More Products
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center space-y-4">
            <div className="flex justify-center">
              <IconBadge label="No products" text="NP" size="lg" variant="neutral" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No products found' : 'No products in this store'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Start adding products to this store from our catalog'}
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const storeInfo = product.stores.find((s) => s.storeUrl === store.storeUrl);
                return (
                  <div
                    key={product._id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <Link href={`/products/${product._id}`}>
                      <div className="aspect-square relative">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                    <div className="p-6">
                      <div className="mb-2">
                        {typeof product.niche === 'object' && product.niche && (
                          <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                            {product.niche.name}
                          </span>
                        )}
                      </div>
                      <Link href={`/products/${product._id}`}>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary-600">
                          {product.title}
                        </h3>
                      </Link>
                      <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                      <div className="mb-4">
                        <span className="text-2xl font-bold text-primary-600">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Added on</span>
                          <span className="text-gray-900 font-medium">
                            {storeInfo
                              ? new Date(storeInfo.addedAt).toLocaleDateString()
                              : new Date(product.addedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-2">
                          <a
                            href={`${store.storeUrl}/products/${product.title.toLowerCase().replace(/\s+/g, '-')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View in Shopify →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

