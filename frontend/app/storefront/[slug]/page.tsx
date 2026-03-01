'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Package, Loader2, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { useCartStore } from '@/store/useCartStore';
import { useCart } from '@/contexts/CartContext';
import { loadTheme } from '@/themes/themeLoader';
import HomeSectionRenderer from '@/components/storefront/HomeSectionRenderer';

export default function StorefrontPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { theme, colors, homeSections = [] } = useStoreTheme();
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [filterOptions, setFilterOptions] = useState<{ tags: string[]; variantDimensions: string[] }>({ tags: [], variantDimensions: [] });
  const { openCart } = useCart();
  const [ThemeComponents, setThemeComponents] = useState<any>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load theme components
  useEffect(() => {
    const themeName = theme?.name || 'modern';
    loadTheme(themeName)
      .then((components) => {
        setThemeComponents(components);
      })
      .catch((error) => {
        console.error('Error loading theme:', error);
        // Fallback to modern theme
        loadTheme('modern').then((components) => {
          setThemeComponents(components);
        });
      });
  }, [theme]);

  useEffect(() => {
    if (slug) {
      api.getStorefrontFilterOptions(slug).then((r) => {
        if (r.success && r.data) setFilterOptions(r.data);
      }).catch(() => {});
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug, debouncedSearch, minPrice, maxPrice, sortBy, selectedTags, selectedVariant]);

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
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          variantDimension: selectedVariant || undefined,
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

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedTags([]);
    setSelectedVariant('');
  };

  const hasActiveFilters = selectedTags.length > 0 || selectedVariant || minPrice || maxPrice;

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

  const hasSectionLayout = Array.isArray(homeSections) && homeSections.length > 0;
  const needsThemeHero = !hasSectionLayout;
  if (!ThemeComponents || !ThemeComponents.Header || !ThemeComponents.Footer) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors?.background || '#ffffff' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors?.accent || '#4a90d9' }} />
      </div>
    );
  }
  if (needsThemeHero && (!ThemeComponents.ProductCard || !ThemeComponents.Hero)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors?.background || '#ffffff' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors?.accent || '#4a90d9' }} />
      </div>
    );
  }

  const { Header, Footer, ProductCard, Hero } = ThemeComponents;
  const themeName = theme?.name || 'modern';
  const themeClass = `${themeName}-theme`;
  const sortedSections = hasSectionLayout ? [...homeSections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];

  return (
    <div className={`min-h-screen flex flex-col ${themeClass}`} style={{ backgroundColor: colors?.background || '#ffffff', position: 'relative', zIndex: 1 }}>
      <Header
        storeSlug={slug}
        storeName={store.name}
        onCartClick={openCart}
      />

      {hasSectionLayout ? (
        <main className="flex-1 relative z-10">
          {sortedSections.map((section) => (
            <HomeSectionRenderer
              key={section.id}
              section={section}
              storeSlug={slug}
              storeName={store.name}
              themeName={themeName}
              currency={store.currency || 'INR'}
            />
          ))}
        </main>
      ) : (
        <>
          <Hero
            storeSlug={slug}
            storeName={store.name}
            heading={`Welcome to ${store.name}`}
            subheading="Discover amazing products"
            ctaText="Shop Now"
            ctaLink={`/storefront/${slug}`}
          />

          {/* Main Content */}
          <main className="flex-1 relative z-10" style={{ maxWidth: 'var(--theme-container-width, 1280px)', margin: '0 auto', width: '100%', padding: '2rem 1rem' }}>
        {/* Search and Filters */}
        <div className="mb-8 space-y-4 relative z-10">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-3 rounded-lg border relative z-10"
                style={{
                  backgroundColor: themeName === 'dark-shade' ? 'rgba(26, 26, 26, 0.8)' : themeName === 'cosmic-space' ? 'rgba(30, 27, 75, 0.7)' : colors.secondary,
                  borderColor: themeName === 'dark-shade' ? 'rgba(255, 255, 255, 0.15)' : themeName === 'cosmic-space' ? 'rgba(167, 139, 250, 0.4)' : colors.primary + '30',
                  color: colors.text,
                }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg relative z-10"
              style={{
                backgroundColor: themeName === 'dark-shade' ? '#64748b' : themeName === 'cosmic-space' ? colors.accent : colors.accent,
                color: '#ffffff',
                boxShadow: themeName === 'dark-shade' ? '0 4px 12px rgba(100, 116, 139, 0.3)' : themeName === 'cosmic-space' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.2)',
              }}
            >
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="rounded-lg border p-6 space-y-4 relative z-10" style={{
              backgroundColor: themeName === 'dark-shade' ? 'rgba(26, 26, 26, 0.6)' : themeName === 'cosmic-space' ? 'rgba(30, 27, 75, 0.6)' : colors.secondary,
              borderColor: themeName === 'dark-shade' ? 'rgba(255, 255, 255, 0.12)' : themeName === 'cosmic-space' ? 'rgba(167, 139, 250, 0.4)' : colors.primary + '30'
            }}>
              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm" style={{ color: colors.text }}>Active:</span>
                  {selectedTags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm" style={{ backgroundColor: colors.accent + '30', color: colors.text }}>
                      {t} <button type="button" onClick={() => toggleTag(t)} aria-label={`Remove ${t}`}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                  {selectedVariant && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm" style={{ backgroundColor: colors.accent + '30', color: colors.text }}>
                      {selectedVariant} <button type="button" onClick={() => setSelectedVariant('')} aria-label="Clear variant"><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  <button type="button" onClick={clearFilters} className="text-sm underline" style={{ color: colors.accent }}>Clear all</button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 relative z-10" style={{ color: colors.text }}>Min Price</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-lg border relative z-10"
                    style={{
                      backgroundColor: themeName === 'dark-shade' ? 'rgba(26, 26, 26, 0.8)' : themeName === 'cosmic-space' ? 'rgba(30, 27, 75, 0.7)' : colors.background,
                      borderColor: themeName === 'dark-shade' ? 'rgba(255, 255, 255, 0.15)' : themeName === 'cosmic-space' ? 'rgba(167, 139, 250, 0.4)' : colors.primary + '30',
                      color: colors.text,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 relative z-10" style={{ color: colors.text }}>Max Price</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="1000"
                    className="w-full px-4 py-2 rounded-lg border relative z-10"
                    style={{
                      backgroundColor: themeName === 'dark-shade' ? 'rgba(26, 26, 26, 0.8)' : themeName === 'cosmic-space' ? 'rgba(30, 27, 75, 0.7)' : colors.background,
                      borderColor: themeName === 'dark-shade' ? 'rgba(255, 255, 255, 0.15)' : themeName === 'cosmic-space' ? 'rgba(167, 139, 250, 0.4)' : colors.primary + '30',
                      color: colors.text,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 relative z-10" style={{ color: colors.text }}>Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border relative z-10"
                    style={{
                      backgroundColor: themeName === 'dark-shade' ? 'rgba(26, 26, 26, 0.8)' : themeName === 'cosmic-space' ? 'rgba(30, 27, 75, 0.7)' : colors.background,
                      borderColor: themeName === 'dark-shade' ? 'rgba(255, 255, 255, 0.15)' : themeName === 'cosmic-space' ? 'rgba(167, 139, 250, 0.4)' : colors.primary + '30',
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
              {(filterOptions.tags.length > 0 || filterOptions.variantDimensions.length > 0) && (
                <div className="space-y-3 pt-2 border-t" style={{ borderColor: colors.primary + '20' }}>
                  {filterOptions.tags.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.tags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className="px-3 py-1.5 rounded-full text-sm transition-all"
                            style={{
                              backgroundColor: selectedTags.includes(tag) ? colors.accent : colors.secondary,
                              color: selectedTags.includes(tag) ? '#fff' : colors.text,
                              border: `1px solid ${selectedTags.includes(tag) ? colors.accent : colors.primary + '30'}`,
                            }}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {filterOptions.variantDimensions.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Variant</label>
                      <select
                        value={selectedVariant}
                        onChange={(e) => setSelectedVariant(e.target.value)}
                        className="w-full max-w-xs px-4 py-2 rounded-lg border"
                        style={{
                          backgroundColor: themeName === 'dark-shade' ? 'rgba(26, 26, 26, 0.8)' : themeName === 'cosmic-space' ? 'rgba(30, 27, 75, 0.7)' : colors.background,
                          borderColor: colors.primary + '30',
                          color: colors.text,
                        }}
                      >
                        <option value="">All</option>
                        {filterOptions.variantDimensions.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="text-center py-16 relative z-10">
                <Package className="h-16 w-16 mx-auto mb-4" style={{ color: colors.text, opacity: 0.6 }} />
                <p style={{ color: colors.text, opacity: 0.8 }}>No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
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
        </>
      )}

      <Footer storeSlug={slug} storeName={store.name} />

      {/* Floating Cart Button */}
      {getTotalItems() > 0 && (
        <button
          onClick={openCart}
          className="fixed bottom-6 right-6 rounded-full p-4 shadow-lg transition-all hover:scale-110 z-30 flex items-center gap-2 cursor-pointer"
          style={{ 
            backgroundColor: themeName === 'dark-shade' ? '#64748b' : themeName === 'cosmic-space' ? colors.accent : colors.accent, 
            color: '#ffffff',
            boxShadow: themeName === 'dark-shade' ? '0 8px 24px rgba(100, 116, 139, 0.4)' : themeName === 'cosmic-space' ? '0 8px 24px rgba(139, 92, 246, 0.4)' : '0 8px 24px rgba(0, 0, 0, 0.3)',
          }}
          aria-label="Open cart"
        >
          <span className="font-bold">{getTotalItems()}</span>
          <span>Cart</span>
        </button>
      )}
    </div>
  );
}
