'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Niche, Product, PaginatedResponse } from '@/types';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import SortDropdown from '@/components/SortDropdown';
import FindWinningProductModal from '@/components/FindWinningProductModal';
import WriteProductDescriptionModal from '@/components/WriteProductDescriptionModal';
import ImportProductModal from '@/components/store/ImportProductModal';
import IconBadge from '@/components/IconBadge';
import { useAuth } from '@/contexts/AuthContext';
import { notify } from '@/lib/toast';
import { Layers, PenLine, Target, Store } from 'lucide-react';

export default function NicheProductsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [niche, setNiche] = useState<Niche | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 24,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const [showFindProduct, setShowFindProduct] = useState(false);
  const [showWriteDescription, setShowWriteDescription] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductTitle, setSelectedProductTitle] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [myStore, setMyStore] = useState<any>(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const sort = (searchParams.get('sort') as any) || niche?.defaultSortMode || 'newest';

  useEffect(() => {
    fetchNiche();
  }, [slug]);

  useEffect(() => {
    if (niche) {
      fetchProducts();
    }
  }, [niche, page, sort]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyStore();
    }
  }, [isAuthenticated]);

  const fetchNiche = async () => {
    try {
      const res = await api.get<{ success: boolean; data: Niche }>(`/api/niches/${slug}`);
      setNiche(res.data);
    } catch (err: any) {
      setError('Niche not found');
      console.error('Error fetching niche:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get<PaginatedResponse<Product>>(
        `/api/niches/${slug}/products?page=${page}&limit=24&sort=${sort}`
      );
      setProducts(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError('Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStore = async () => {
    try {
      const response = await api.getMyStore();
      if (response.success && response.data) {
        setMyStore(response.data);
      }
    } catch (err: any) {
      // Store might not exist, that's okay
      console.error('Error fetching my store:', err);
    }
  };

  const handleImportClick = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProduct(product);
    setShowImportModal(true);
  };

  if (error && !niche) {
    return (
      <div className="min-h-screen bg-surface-base">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <p className="text-text-secondary text-lg mb-4">{error}</p>
            <Link
              href="/products"
              className="text-text-primary hover:text-primary-500 underline"
            >
              Back to Niches
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!niche) {
    return (
      <div className="min-h-screen bg-surface-base">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  // Override themeColor to prevent cyan/teal colors
  const themeColor = niche.themeColor;
  const isCyanTeal = themeColor && (
    themeColor.toLowerCase().includes('#1ac8ed') ||
    themeColor.toLowerCase().includes('#17b4d5') ||
    themeColor.toLowerCase().includes('#5d737e') ||
    themeColor.toLowerCase().includes('#87bba2') ||
    themeColor.toLowerCase().includes('cyan') ||
    themeColor.toLowerCase().includes('teal')
  );
  const headerStyle = themeColor && !isCyanTeal
    ? { backgroundColor: themeColor, color: niche.textColor || '#FFFFFF' }
    : {};

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />

      {/* Niche Header */}
      <div className="border-b border-border-default" style={headerStyle}>
        <div className="container mx-auto px-4 py-12">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <Link href="/" className="hover:text-text-primary">
                Home
              </Link>
              <span>/</span>
              <Link href="/products" className="hover:text-text-primary">
                Products
              </Link>
              <span>/</span>
              <span className={themeColor && !isCyanTeal ? '' : 'text-text-primary'}>
                {niche.name}
              </span>
            </div>
          </nav>

          <div className="flex items-start gap-6">
            <IconBadge
              icon={Layers}
              label={niche.name}
              size="lg"
            />
            <div className="flex-1">
              <h1
                className={`text-4xl font-bold mb-4 ${
                  themeColor && !isCyanTeal ? '' : 'text-text-primary'
                }`}
              >
                {niche.name}
              </h1>
              {niche.richDescription ? (
                <div
                  className={`prose prose-invert max-w-none ${
                    themeColor && !isCyanTeal ? '' : 'text-text-secondary'
                  }`}
                  dangerouslySetInnerHTML={{ __html: niche.richDescription }}
                />
              ) : (
                <p
                  className={`text-lg ${
                    themeColor && !isCyanTeal ? 'opacity-90' : 'text-text-secondary'
                  }`}
                >
                  {niche.description || 'Browse products in this niche'}
                </p>
              )}
              <div className="mt-4">
                <span
                  className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    themeColor && !isCyanTeal
                      ? 'bg-white bg-opacity-20'
                      : 'bg-surface-hover text-text-primary border border-border-default'
                  }`}
                >
                  {pagination.total} {pagination.total === 1 ? 'Product' : 'Products'}
                </span>
              </div>
            </div>
            <Link
              href="/products"
              className={`px-4 py-2 rounded-lg border transition-colors ${
                themeColor && !isCyanTeal
                  ? 'bg-white bg-opacity-20 border-white border-opacity-30 hover:bg-opacity-30'
                  : 'bg-surface-raised border-border-default text-text-primary hover:bg-surface-hover'
              }`}
            >
              Back to Niches
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-text-secondary text-sm">
            {loading ? (
              'Loading...'
            ) : (
              <>
                Showing {products.length} of {pagination.total} products
              </>
            )}
          </div>
          <SortDropdown defaultSort={niche.defaultSortMode} />
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-surface-raised border border-border-default rounded-xl overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-surface-elevated"></div>
                <div className="p-6">
                  <div className="h-4 bg-surface-elevated rounded mb-2"></div>
                  <div className="h-4 bg-surface-elevated rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-secondary text-lg mb-4">
              No products available in this niche
            </p>
            <Link
              href="/products"
              className="text-text-primary hover:text-primary-500 underline"
            >
              Browse other niches
            </Link>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const nicheData =
                  typeof product.niche === 'object' ? product.niche : null;

                return (
                  <div
                    key={product._id}
                    className="bg-surface-raised border border-border-default rounded-xl shadow-lg overflow-hidden hover:border-primary-500 hover:shadow-xl transition-all group relative"
                  >
                    <Link href={`/products/${product._id}`}>
                      <div className="aspect-square relative">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6">
                        {product.category && (
                          <div className="mb-2">
                            <span className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                              {product.category}
                            </span>
                          </div>
                        )}
                        <h3 className="text-xl font-bold text-text-primary mb-2">
                          {product.title}
                        </h3>
                        <p className="text-text-secondary mb-4 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-text-primary">
                            ₹{product.price.toFixed(2)}
                          </span>
                          <span className="text-text-primary font-semibold">
                            View Details →
                          </span>
                        </div>
                      </div>
                    </Link>
                    {isAuthenticated && (
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {myStore && (
                          <button
                            onClick={(e) => handleImportClick(product, e)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-lg flex items-center gap-2"
                            title="Import to Store Dashboard"
                          >
                            <Store className="h-4 w-4" />
                            Import
                          </button>
                        )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedProductId(product._id);
                          setSelectedProductTitle(product.title);
                          setShowWriteDescription(true);
                        }}
                          className="bg-primary-500 hover:bg-primary-600 text-black px-3 py-1.5 rounded-lg text-sm font-semibold shadow-lg flex items-center gap-2"
                        title="Write Product Description (AI)"
                      >
                        <IconBadge icon={PenLine} label="AI assistant" size="sm" variant="neutral" className="bg-black/10 border-white/30" />
                        Write
                      </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
            />
          </>
        )}

        {/* Floating Action Button - Find Winning Product */}
        {isAuthenticated && (
          <button
            onClick={() => setShowFindProduct(true)}
            className="fixed bottom-8 right-8 bg-primary-500 hover:bg-primary-600 text-black p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center gap-2 font-semibold"
            aria-label="Find Winning Product"
          >
            <IconBadge icon={Target} label="Find winning product" size="sm" variant="neutral" className="bg-black/10 border-white/30" />
            <span className="hidden md:inline">Find Winning Product</span>
          </button>
        )}
      </div>

      <FindWinningProductModal
        isOpen={showFindProduct}
        onClose={() => setShowFindProduct(false)}
      />

      <WriteProductDescriptionModal
        isOpen={showWriteDescription}
        onClose={() => {
          setShowWriteDescription(false);
          setSelectedProductId('');
          setSelectedProductTitle('');
        }}
        productId={selectedProductId}
        productTitle={selectedProductTitle}
      />

      {showImportModal && selectedProduct && myStore && (
        <ImportProductModal
          product={{
            _id: selectedProduct._id,
            title: selectedProduct.title,
            description: selectedProduct.description,
            price: selectedProduct.price,
            images: selectedProduct.images,
            niche: typeof selectedProduct.niche === 'object' ? selectedProduct.niche : undefined,
          }}
          store={myStore}
          onClose={() => {
            setShowImportModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={() => {
            setShowImportModal(false);
            setSelectedProduct(null);
            notify.success('Product imported to your store successfully!');
          }}
        />
      )}
    </div>
  );
}






