'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Package, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { useCartStore } from '@/store/useCartStore';
import { useCart } from '@/contexts/CartContext';
import { loadTheme } from '@/themes/themeLoader';

export default function StorefrontPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { theme, colors } = useStoreTheme();
  const { getTotalItems } = useCartStore();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const { openCart } = useCart();
  const [ThemeComponents, setThemeComponents] = useState<any>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load theme components
  useEffect(() => {
    const themeName = theme?.name || 'minimal';
    loadTheme(themeName)
      .then((components) => {
        setThemeComponents(components);
      })
      .catch((error) => {
        console.error('Error loading theme:', error);
        // Fallback to minimal theme
        loadTheme('minimal').then((components) => {
          setThemeComponents(components);
        });
      });
  }, [theme]);

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

  if (loading || !ThemeComponents || !theme) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background || '#ffffff' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.accent || '#4a90d9' }} />
      </div>
    );
  }

  if (error || !store) {
    const bgColor = colors?.background || '#ffffff';
    const textColor = colors?.text || '#1a1a1a';
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4" style={{ color: textColor + '80' }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: textColor }}>Store Not Found</h1>
          <p style={{ color: textColor + 'CC' }}>{error || 'This store does not exist or is not active'}</p>
        </div>
      </div>
    );
  }

  if (!ThemeComponents || !ThemeComponents.Header || !ThemeComponents.Footer || !ThemeComponents.ProductCard || !ThemeComponents.Hero) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors?.background || '#ffffff' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors?.accent || '#4a90d9' }} />
      </div>
    );
  }

  const { Header, Footer, ProductCard, Hero } = ThemeComponents;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors?.background || '#ffffff' }}>
      {/* Header */}
      <Header
        storeSlug={slug}
        storeName={store.name}
        onCartClick={openCart}
      />

      {/* Hero Section */}
      <Hero
        storeSlug={slug}
        storeName={store.name}
        heading={`Welcome to ${store.name}`}
        subheading="Discover amazing products"
        ctaText="Shop Now"
        ctaLink={`/storefront/${slug}`}
      />

      {/* Main Content */}
      <main className="flex-1" style={{ maxWidth: 'var(--theme-container-width, 1280px)', margin: '0 auto', width: '100%', padding: '2rem 1rem' }}>
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-3 rounded-lg border"
                style={{
                  backgroundColor: colors.secondary,
                  borderColor: colors.primary + '30',
                  color: colors.text,
                }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 rounded-lg font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: colors.accent,
                color: '#ffffff',
              }}
            >
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="rounded-lg border p-6 space-y-4" style={{ backgroundColor: colors.secondary, borderColor: colors.primary + '30' }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Min Price</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.primary + '30',
                      color: colors.text,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Max Price</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="1000"
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.primary + '30',
                      color: colors.text,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.primary + '30',
                      color: colors.text,
                    }}
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

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto mb-4" style={{ color: colors.text + '60' }} />
            <p style={{ color: colors.text + 'CC' }}>No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                storeSlug={slug}
                currency={store.currency}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer storeSlug={slug} storeName={store.name} />

      {/* Floating Cart Button */}
      {getTotalItems() > 0 && (
        <button
          onClick={openCart}
          className="fixed bottom-6 right-6 rounded-full p-4 shadow-lg transition-all hover:scale-110 z-30 flex items-center gap-2 cursor-pointer"
          style={{ backgroundColor: colors.accent, color: '#ffffff' }}
          aria-label="Open cart"
        >
          <span className="font-bold">{getTotalItems()}</span>
          <span>Cart</span>
        </button>
      )}
    </div>
  );
}
