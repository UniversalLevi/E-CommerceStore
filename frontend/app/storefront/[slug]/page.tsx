'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Package, Loader2, Search, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';

export default function StorefrontPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug, debouncedSearch, minPrice, maxPrice, sortBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [storeResponse, productsResponse] = await Promise.all([
        api.getStorefrontInfo(slug),
        api.getStorefrontProducts(slug, {
          search: debouncedSearch || undefined,
          minPrice: minPrice ? parseFloat(minPrice) * 100 : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) * 100 : undefined,
          sort: sortBy,
        }),
      ]);

      if (storeResponse.success) {
        setStore(storeResponse.data);
      }

      if (productsResponse.success) {
        setProducts(productsResponse.data.products || []);
      }
    } catch (error: any) {
      console.error('Error fetching storefront data:', error);
      setError(error.response?.data?.message || 'Store not found');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'INR') => {
    const currencySymbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${(price / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-text-secondary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Store Not Found</h1>
          <p className="text-text-secondary">{error || 'This store does not exist or is not active'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Header */}
      <header className="bg-surface-raised border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-text-primary">{store.name}</h1>
            {store.settings?.testMode && (
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full border border-yellow-500/30">
                🧪 TEST MODE
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Products */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary placeholder-text-secondary"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2"
            >
              <SlidersHorizontal className="h-5 w-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="bg-surface-raised rounded-lg border border-border-default p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Min Price</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Max Price</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="1000"
                    className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <p className="text-text-secondary">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product._id}
                href={`/storefront/${slug}/products/${product._id}`}
                className="bg-surface-raised rounded-lg border border-border-default overflow-hidden hover:border-purple-500/50 transition-colors"
              >
                {product.images && product.images.length > 0 && (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-text-primary mb-2">{product.title}</h3>
                  <p className="text-lg font-bold text-purple-500">
                    {formatPrice(product.basePrice, store.currency)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
