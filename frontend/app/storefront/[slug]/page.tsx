'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Package, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function StorefrontPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [storeResponse, productsResponse] = await Promise.all([
        api.getStorefrontInfo(slug),
        api.getStorefrontProducts(slug),
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
          <h1 className="text-2xl font-bold text-text-primary">{store.name}</h1>
        </div>
      </header>

      {/* Products */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <p className="text-text-secondary">No products available yet</p>
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
