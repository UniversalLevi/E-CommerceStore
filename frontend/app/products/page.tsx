'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Niche } from '@/types';
import Navbar from '@/components/Navbar';
import FindWinningProductModal from '@/components/FindWinningProductModal';
import IconBadge from '@/components/IconBadge';
import { useAuth } from '@/contexts/AuthContext';

export default function ProductsPage() {
  const { isAuthenticated } = useAuth();
  const [featuredNiches, setFeaturedNiches] = useState<Niche[]>([]);
  const [homepageNiches, setHomepageNiches] = useState<Niche[]>([]);
  const [allNiches, setAllNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFindProduct, setShowFindProduct] = useState(false);

  useEffect(() => {
    fetchNiches();
  }, []);

  const fetchNiches = async () => {
    try {
      setLoading(true);
      const [featuredRes, homepageRes, allRes] = await Promise.all([
        api.get<{ success: boolean; data: Niche[] }>('/api/niches?featured=true'),
        api.get<{ success: boolean; data: Niche[] }>('/api/niches?showOnHomePage=true'),
        api.get<{ success: boolean; data: Niche[] }>('/api/niches'),
      ]);

      setFeaturedNiches(featuredRes.data || []);
      setHomepageNiches(homepageRes.data || []);
      setAllNiches(allRes.data || []);
    } catch (err: any) {
      setError('Failed to load niches');
      console.error('Error fetching niches:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 bg-surface-base">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Filter out featured from homepage and all niches to avoid duplicates
  const featuredIds = new Set(featuredNiches.map((n) => n._id));
  const homepageFiltered = homepageNiches.filter((n) => !featuredIds.has(n._id));
  const allFiltered = allNiches.filter(
    (n) => !featuredIds.has(n._id) && !homepageNiches.some((h) => h._id === n._id)
  );

  const NicheCard = ({ niche }: { niche: Niche }) => {
    const productCount = niche.productCount || niche.activeProductCount || 0;
    // Override themeColor to prevent cyan/teal colors - use theme tokens instead
    const themeColor = niche.themeColor;
    const isCyanTeal = themeColor && (
      themeColor.toLowerCase().includes('#1ac8ed') ||
      themeColor.toLowerCase().includes('#17b4d5') ||
      themeColor.toLowerCase().includes('#5d737e') ||
      themeColor.toLowerCase().includes('#87bba2') ||
      themeColor.toLowerCase().includes('cyan') ||
      themeColor.toLowerCase().includes('teal')
    );
    const cardStyle = themeColor && !isCyanTeal
      ? { backgroundColor: themeColor, color: niche.textColor || '#FFFFFF' }
      : {};

    return (
      <Link
        href={`/products/niches/${niche.slug}`}
        className="bg-surface-raised border border-border-default rounded-xl shadow-lg overflow-hidden hover:border-primary-500 hover:shadow-xl transition-all group"
        style={cardStyle}
      >
        <div className="aspect-square relative flex items-center justify-center bg-gradient-to-br from-surface-base to-surface-raised">
          {niche.image ? (
            <img
              src={niche.image}
              alt={niche.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <IconBadge
              text={
                typeof niche.icon === 'string'
                  ? niche.icon.replace(/[^A-Za-z0-9]/g, '').slice(0, 3)
                  : undefined
              }
              label={niche.name}
              size="lg"
            />
          )}
        </div>
        <div className="p-6" style={cardStyle.color ? {} : {}}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {niche.featured && (
                <span className="text-xs font-semibold bg-primary-500 text-black px-2 py-1 rounded uppercase">
                  Featured
                </span>
              )}
              {niche.isDefault && (
                <span className="text-xs font-semibold bg-accent-500 text-white px-2 py-1 rounded uppercase">
                  Default
                </span>
              )}
            </div>
            <span className="text-sm font-semibold bg-surface-elevated text-text-primary px-3 py-1 rounded-full border border-border-default">
              {productCount} {productCount === 1 ? 'Product' : 'Products'}
            </span>
          </div>
          <h3
            className={`text-xl font-bold mb-2 ${
              niche.themeColor ? '' : 'text-text-primary'
            }`}
          >
            {niche.name}
          </h3>
          <p
            className={`mb-4 line-clamp-2 ${
              niche.themeColor ? 'opacity-90' : 'text-text-secondary'
            }`}
          >
            {niche.description || 'Browse products in this niche'}
          </p>
          <div className="flex items-center justify-between">
            <span
              className={`font-semibold ${
                niche.themeColor ? '' : 'text-text-primary'
              }`}
            >
              Browse Products →
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-text-primary mb-4">Product Catalog</h1>
        <p className="text-xl text-text-secondary">
          Select a niche to browse products
        </p>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Featured Niches Section */}
      {featuredNiches.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Featured Niches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredNiches.map((niche) => (
              <NicheCard key={niche._id} niche={niche} />
            ))}
          </div>
        </div>
      )}

      {/* Homepage Niches Section */}
      {homepageFiltered.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Popular Niches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {homepageFiltered.map((niche) => (
              <NicheCard key={niche._id} niche={niche} />
            ))}
          </div>
        </div>
      )}

      {/* All Niches Section */}
      {allFiltered.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6">All Niches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allFiltered.map((niche) => (
              <NicheCard key={niche._id} niche={niche} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {featuredNiches.length === 0 &&
        homepageFiltered.length === 0 &&
        allFiltered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-text-muted text-lg">
              No niches available at the moment
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button - Find Winning Product */}
      {isAuthenticated && (
        <button
          onClick={() => setShowFindProduct(true)}
          className="fixed bottom-8 right-8 bg-black hover:bg-gray-700 text-white p-4 rounded-full shadow-2xl hover:shadow-2xl transition-all z-50 flex items-center gap-2 font-semibold border-4 border-gray-600 ring-4 ring-gray-500/30"
          aria-label="Find Winning Product"
        >
          <IconBadge text="FW" label="Find winning product" size="sm" variant="primary" className="bg-white/10 border-white/30" />
          <span className="hidden md:inline">Find Winning Product</span>
        </button>
      )}

      <FindWinningProductModal
        isOpen={showFindProduct}
        onClose={() => setShowFindProduct(false)}
      />
    </div>
  );
}
