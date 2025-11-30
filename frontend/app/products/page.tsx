'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Niche } from '@/types';
import Navbar from '@/components/Navbar';
import FindWinningProductModal from '@/components/FindWinningProductModal';
import IconBadge from '@/components/IconBadge';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Target } from 'lucide-react';

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
      <div className="flex items-center justify-center py-16 bg-black">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-purple-500 border-r-blue-500"></div>
          <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-blue-500 border-r-purple-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
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
        className="glass-card glass-card-hover rounded-2xl overflow-hidden transition-all group hover:-translate-y-1"
        style={cardStyle}
      >
        <div className="aspect-square relative flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-blue-500/10">
          {niche.image ? (
            <img
              src={niche.image}
              alt={niche.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <IconBadge
              icon={Package}
              label={niche.name}
              size="lg"
            />
          )}
        </div>
        <div className="p-6" style={cardStyle.color ? {} : {}}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {niche.featured && (
                <span className="text-xs font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded uppercase">
                  Featured
                </span>
              )}
              {niche.isDefault && (
                <span className="text-xs font-semibold bg-purple-500/30 text-purple-300 px-2 py-1 rounded uppercase">
                  Default
                </span>
              )}
            </div>
            <span className="text-sm font-semibold bg-white/10 text-text-primary px-3 py-1 rounded-full border border-white/10">
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
    <div className="min-h-screen bg-gradient-hero relative">
      <div className="absolute inset-0 bg-radial-glow-purple opacity-30"></div>
      <div className="absolute inset-0 grid-pattern opacity-20"></div>
      <Navbar />
      <div className="container mx-auto px-4 py-4 md:py-8 relative z-10">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
          <span className="text-gradient-purple">Product Catalog</span>
        </h1>
        <p className="text-base md:text-lg lg:text-xl text-text-secondary">
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
        <div className="mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-gradient-blue mb-4 md:mb-6">Featured Niches</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {featuredNiches.map((niche) => (
              <NicheCard key={niche._id} niche={niche} />
            ))}
          </div>
        </div>
      )}

      {/* Homepage Niches Section */}
      {homepageFiltered.length > 0 && (
        <div className="mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4 md:mb-6">Popular Niches</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {homepageFiltered.map((niche) => (
              <NicheCard key={niche._id} niche={niche} />
            ))}
          </div>
        </div>
      )}

      {/* All Niches Section */}
      {allFiltered.length > 0 && (
        <div className="mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4 md:mb-6">All Niches</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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
          className="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white p-3 md:p-4 rounded-full shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all z-50 flex items-center gap-2 font-semibold min-h-[44px] min-w-[44px]"
          aria-label="Find Winning Product"
        >
          <IconBadge icon={Target} label="Find winning product" size="sm" variant="primary" className="bg-white/10 border-white/30" />
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
