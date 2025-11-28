'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Product, Niche } from '@/types';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import IconBadge from '@/components/IconBadge';

interface SearchResults {
  products: Product[];
  niches: Niche[];
  total: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [results, setResults] = useState<SearchResults>({
    products: [],
    niches: [],
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedType, setSelectedType] = useState(type);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, type, page]);

  const performSearch = async () => {
    if (!query.trim()) {
      setResults({ products: [], niches: [], total: 0 });
      return;
    }

    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.append('q', query);
      if (type !== 'all') params.append('type', type);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await api.get<{
        success: boolean;
        data: SearchResults;
        pagination: typeof pagination;
        query: string;
      }>(`/api/search?${params.toString()}`);

      setResults(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError('Failed to perform search');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=${selectedType}`);
  };

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    router.push(`/search?q=${encodeURIComponent(query)}&type=${newType}`);
  };

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-text-primary mb-6">Search</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products and niches..."
              className="flex-1 px-4 py-3 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="px-4 py-3 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All</option>
              <option value="products">Products</option>
              <option value="niches">Niches</option>
            </select>
            <button
              type="submit"
              className="bg-primary-500 hover:bg-primary-600 text-black px-8 py-3 rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : query ? (
          <>
            {results.total === 0 ? (
              <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-12 text-center space-y-4">
                <div className="flex justify-center">
                  <IconBadge label="No results" text="NR" size="lg" variant="neutral" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  No results found
                </h3>
                <p className="text-text-secondary">
                  Try adjusting your search query or browse our{' '}
                  <Link href="/products" className="text-text-primary hover:text-primary-500">
                    product catalog
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <>
                {/* Results Summary */}
                <div className="mb-6 text-text-secondary">
                  Found {results.total} result{results.total !== 1 ? 's' : ''} for "{query}"
                </div>

                {/* Niches Results */}
                {results.niches.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-text-primary mb-4">Niches</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.niches.map((niche) => (
                        <Link
                          key={niche._id}
                          href={`/products/niches/${niche.slug}`}
                          className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 hover:border-primary-500 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <IconBadge
                              text={
                                typeof niche.icon === 'string'
                                  ? niche.icon.replace(/[^A-Za-z0-9]/g, '').slice(0, 3)
                                  : undefined
                              }
                              label={niche.name}
                              size="sm"
                            />
                            <h3 className="text-xl font-bold text-text-primary">{niche.name}</h3>
                          </div>
                          {niche.description && (
                            <p className="text-text-secondary mb-4 line-clamp-2">
                              {niche.description}
                            </p>
                          )}
                          <div className="text-sm text-text-primary font-medium">
                            {niche.activeProductCount || niche.productCount || 0} products →
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Results */}
                {results.products.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary mb-4">Products</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.products.map((product) => (
                        <Link
                          key={product._id}
                          href={`/products/${product._id}`}
                          className="bg-surface-raised border border-border-default rounded-xl shadow-md overflow-hidden hover:border-primary-500 hover:shadow-lg transition-all"
                        >
                          <div className="aspect-square relative">
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-6">
                            {typeof product.niche === 'object' && product.niche && (
                              <span className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                                {product.niche.name}
                              </span>
                            )}
                            <h3 className="text-xl font-bold text-text-primary mb-2 mt-2">
                              {product.title}
                            </h3>
                            <p className="text-text-secondary mb-4 line-clamp-2">
                              {product.description}
                            </p>
                            <div className="text-2xl font-bold text-text-primary">
                              ${product.price.toFixed(2)}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.pages}
                      onPageChange={(newPage) => {
                        router.push(
                          `/search?q=${encodeURIComponent(query)}&type=${type}&page=${newPage}`
                        );
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-12 text-center space-y-4">
            <div className="flex justify-center">
              <IconBadge label="Search" text="SR" size="lg" variant="neutral" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Start Searching
            </h3>
            <p className="text-text-secondary mb-6">
              Enter a search query above to find products and niches
            </p>
            <Link
              href="/products"
              className="inline-block bg-primary-500 hover:bg-primary-600 text-black px-6 py-3 rounded-lg transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

