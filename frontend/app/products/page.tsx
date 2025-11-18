'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Niche } from '@/types';
import Navbar from '@/components/Navbar';

export default function ProductsPage() {
  const [featuredNiches, setFeaturedNiches] = useState<Niche[]>([]);
  const [homepageNiches, setHomepageNiches] = useState<Niche[]>([]);
  const [allNiches, setAllNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
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
    const cardStyle = niche.themeColor
      ? { backgroundColor: niche.themeColor, color: niche.textColor || '#FFFFFF' }
      : {};

    return (
      <Link
        href={`/products/niches/${niche.slug}`}
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden hover:border-primary-500 hover:shadow-xl transition-all group"
        style={cardStyle}
      >
        <div className="aspect-square relative flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          {niche.image ? (
            <img
              src={niche.image}
              alt={niche.name}
              className="w-full h-full object-cover"
            />
          ) : niche.icon ? (
            <div className="text-8xl">{niche.icon}</div>
          ) : (
            <div className="text-6xl text-gray-500">📦</div>
          )}
        </div>
        <div className="p-6" style={cardStyle.color ? {} : {}}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {niche.featured && (
                <span className="text-xs font-semibold bg-yellow-500 text-yellow-900 px-2 py-1 rounded uppercase">
                  Featured
                </span>
              )}
              {niche.isDefault && (
                <span className="text-xs font-semibold bg-gray-600 text-gray-200 px-2 py-1 rounded uppercase">
                  Default
                </span>
              )}
            </div>
            <span className="text-sm font-semibold bg-primary-600 text-white px-3 py-1 rounded-full">
              {productCount} {productCount === 1 ? 'Product' : 'Products'}
            </span>
          </div>
          <h3
            className={`text-xl font-bold mb-2 ${
              niche.themeColor ? '' : 'text-white'
            }`}
          >
            {niche.name}
          </h3>
          <p
            className={`mb-4 line-clamp-2 ${
              niche.themeColor ? 'opacity-90' : 'text-gray-400'
            }`}
          >
            {niche.description || 'Browse products in this niche'}
          </p>
          <div className="flex items-center justify-between">
            <span
              className={`font-semibold ${
                niche.themeColor ? '' : 'text-primary-400'
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
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Product Catalog</h1>
          <p className="text-xl text-gray-300">
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
            <h2 className="text-2xl font-bold text-white mb-6">Featured Niches</h2>
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
            <h2 className="text-2xl font-bold text-white mb-6">Popular Niches</h2>
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
            <h2 className="text-2xl font-bold text-white mb-6">All Niches</h2>
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
              <p className="text-gray-400 text-lg">
                No niches available at the moment
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
