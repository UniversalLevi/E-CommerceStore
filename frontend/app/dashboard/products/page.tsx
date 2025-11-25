'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { notify } from '@/lib/toast';

interface UserProduct extends Product {
  stores: Array<{
    storeUrl: string;
    addedAt: string;
  }>;
  addedAt: string;
}

export default function MyProductsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated, selectedStore]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStore && selectedStore !== 'all') {
        params.append('storeUrl', selectedStore);
      }

      const response = await api.get<{ success: boolean; data: UserProduct[] }>(
        `/api/products/user?${params.toString()}`
      );
      setProducts(response.data);
    } catch (err: any) {
      setError('Failed to load products');
      notify.error('Failed to load your products');
    } finally {
      setLoading(false);
    }
  };

  // Get unique stores from products
  const allStores = Array.from(
    new Set(
      products.flatMap((p) => p.stores.map((s) => s.storeUrl))
    )
  );

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-base">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text-primary">My Added Products</h1>
          <Link
            href="/products"
            className="bg-primary-500 hover:bg-primary-600 text-black px-6 py-3 rounded-lg transition-colors"
          >
            Browse Products
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          {allStores.length > 0 && (
            <div className="md:w-64">
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Stores</option>
                {allStores.map((storeUrl) => (
                  <option key={storeUrl} value={storeUrl}>
                    {storeUrl.replace('https://', '').replace('.myshopify.com', '')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {searchQuery ? 'No products found' : 'No products added yet'}
            </h3>
            <p className="text-text-secondary mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Start by browsing our product catalog and adding products to your stores'}
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary-500 hover:bg-primary-600 text-black px-6 py-3 rounded-lg transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-surface-raised border border-border-default rounded-xl shadow-md overflow-hidden hover:border-primary-500 hover:shadow-lg transition-all"
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
                      <span className="text-xs font-semibold text-primary-500 uppercase tracking-wide">
                        {product.niche.name}
                      </span>
                    )}
                  </div>
                  <Link href={`/products/${product._id}`}>
                    <h3 className="text-xl font-bold text-text-primary mb-2 hover:text-primary-500">
                      {product.title}
                    </h3>
                  </Link>
                  <p className="text-text-secondary mb-4 line-clamp-2">{product.description}</p>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-primary-500">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Stores */}
                  <div className="border-t border-border-default pt-4">
                    <p className="text-sm font-medium text-text-primary mb-2">
                      Added to {product.stores.length} {product.stores.length === 1 ? 'store' : 'stores'}:
                    </p>
                    <div className="space-y-2">
                      {product.stores.map((store, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <a
                            href={store.storeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-500 hover:text-primary-600 truncate"
                          >
                            {store.storeUrl.replace('https://', '').replace('.myshopify.com', '')}
                          </a>
                          <span className="text-xs text-text-muted">
                            {new Date(store.addedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

