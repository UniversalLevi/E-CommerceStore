'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Product, Niche } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import StoreSelectionModal from '@/components/StoreSelectionModal';
import WriteProductDescriptionModal from '@/components/WriteProductDescriptionModal';
import ImportProductModal from '@/components/store/ImportProductModal';
import IconBadge from '@/components/IconBadge';
import { notify } from '@/lib/toast';
import { CheckCircle2, Tag, ShoppingCart, PenLine, Target, LogIn, Store } from 'lucide-react';

interface InternalStore {
  _id: string;
  name: string;
  slug: string;
  status: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [niche, setNiche] = useState<Niche | null>(null);
  const [stores, setStores] = useState<InternalStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showWriteDescription, setShowWriteDescription] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [myStore, setMyStore] = useState<any>(null);
  const [storeData, setStoreData] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStores();
      fetchMyStore();
    }
  }, [isAuthenticated]);

  const fetchProduct = async (id: string) => {
    try {
      const response = await api.get<{ success: boolean; data: Product }>(
        `/api/products/${id}`
      );
      setProduct(response.data);
      
      // Track product view
      if (isAuthenticated) {
        try {
          await api.post('/api/analytics/product-view', { productId: id });
        } catch (err) {
          // Ignore tracking errors
          console.error('Failed to track product view:', err);
        }
      }
      
      // Extract niche if populated
      if (response.data.niche && typeof response.data.niche === 'object') {
        const nicheData = response.data.niche as Niche;
        setNiche(nicheData);
        // Fetch related products from same niche
        const nicheId = nicheData._id || (nicheData as any)._id;
        if (nicheId) {
          fetchRelatedProducts(nicheId, id);
        }
      } else if (response.data.niche) {
        // If niche is just an ID, fetch it
        try {
          const nicheId = response.data.niche as string;
          fetchRelatedProducts(nicheId, id);
        } catch (err) {
          console.error('Error fetching niche:', err);
        }
      }
    } catch (err: any) {
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (nicheId: string, excludeProductId: string) => {
    try {
      setLoadingRelated(true);
      const response = await api.get<{ success: boolean; data: Product[] }>(
        `/api/products?niche=${nicheId}&limit=4&active=true`
      );
      // Filter out current product
      const related = response.data.filter((p) => p._id !== excludeProductId).slice(0, 4);
      setRelatedProducts(related);
    } catch (err: any) {
      console.error('Error fetching related products:', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleShare = (platform: string) => {
    if (typeof window === 'undefined' || !product) return;

    const url = window.location.href;
    const title = product.title;
    const text = product.description.substring(0, 200);
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    } else if (navigator.share) {
      navigator.share({
        title,
        text,
        url,
      });
    }
  };

  const fetchStores = async () => {
    try {
      setLoadingStores(true);
      const response = await api.getMyStore();
      if (response.success && response.data) {
        setStores([response.data]);
      } else {
        setStores([]);
      }
    } catch (err: any) {
      console.error('Error fetching stores:', err);
      setStores([]);
    } finally {
      setLoadingStores(false);
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

  const handleStoreSuccess = (data: any) => {
    setStoreData(data);
    setShowSuccessModal(true);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero relative">
        <div className="absolute inset-0 bg-radial-glow-purple opacity-30"></div>
        <Navbar />
        <div className="flex items-center justify-center py-16 relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-purple-500 border-r-blue-500"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-blue-500 border-r-purple-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !product) {
    return (
      <div className="min-h-screen bg-gradient-hero relative">
        <div className="absolute inset-0 bg-radial-glow-purple opacity-30"></div>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center relative z-10">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Product Not Found
          </h2>
          <button
            onClick={() => router.push('/products')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-3 rounded-lg transition-colors shadow-lg shadow-purple-500/25"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  // Render nothing if no product
  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero relative">
      <div className="absolute inset-0 bg-radial-glow-purple opacity-30"></div>
      <div className="absolute inset-0 grid-pattern opacity-20"></div>
      <Navbar />

      {/* Success Modal */}
      {showSuccessModal && storeData && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="text-center mb-6 space-y-4">
              <div className="flex justify-center">
                <IconBadge label="Store created" icon={CheckCircle2} size="lg" variant="success" />
              </div>
              <h2 className="text-3xl font-bold text-text-primary mb-2">
                Store Created Successfully!
              </h2>
              <p className="text-text-secondary">
                Your store is now live with the selected product
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-surface-elevated border border-border-default rounded-lg p-4">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Store URL
                </label>
                <a
                  href={storeData.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-primary hover:text-primary-500 break-all"
                >
                  {storeData.storeUrl}
                </a>
              </div>

              <div className="bg-surface-elevated border border-border-default rounded-lg p-4">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Product URL
                </label>
                <a
                  href={storeData.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-primary hover:text-primary-500 break-all"
                >
                  {storeData.productUrl}
                </a>
              </div>

              <div className="bg-surface-elevated border border-border-default rounded-lg p-4">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Admin Panel
                </label>
                <a
                  href={storeData.adminUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-primary hover:text-primary-500 break-all"
                >
                  Manage Product
                </a>
              </div>

              {storeData.usedStore && (
                <div className="bg-surface-hover border border-border-default rounded-lg p-4">
                  <p className="text-sm text-text-secondary">
                    <strong>Store Used:</strong> {storeData.usedStore.name}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-black py-3 rounded-lg font-semibold transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 bg-surface-hover hover:bg-surface-elevated text-text-primary py-3 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          {niche && (
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
                <Link
                  href={`/products/niches/${niche.slug}`}
                  className="hover:text-text-primary"
                >
                  {niche.name}
                </Link>
                <span>/</span>
                <span className="text-text-primary">{product.title}</span>
              </div>
            </nav>
          )}

          <div className="glass-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10">
            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Images */}
              <div>
                <div
                  className="aspect-square rounded-lg overflow-hidden mb-4 cursor-zoom-in relative group"
                  onClick={() => setShowImageZoom(true)}
                >
                  <img
                    src={product.images[selectedImage]}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                    <span className="text-text-primary opacity-0 group-hover:opacity-100 text-sm font-medium">
                      Click to zoom
                    </span>
                  </div>
                </div>
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImage === index
                            ? 'border-primary-500'
                            : 'border-border-default hover:border-primary-500'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div>
                <div className="mb-4 flex items-center gap-3 flex-wrap">
                  {/* Niche Badge */}
                  {niche && (
                    <Link
                      href={`/products/niches/${niche.slug}`}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                        niche.themeColor && !(
                          niche.themeColor.toLowerCase().includes('#1ac8ed') ||
                          niche.themeColor.toLowerCase().includes('#17b4d5') ||
                          niche.themeColor.toLowerCase().includes('#5d737e') ||
                          niche.themeColor.toLowerCase().includes('#87bba2') ||
                          niche.themeColor.toLowerCase().includes('cyan') ||
                          niche.themeColor.toLowerCase().includes('teal')
                        )
                          ? ''
                          : 'bg-surface-hover text-text-primary hover:bg-surface-elevated border border-border-default'
                      }`}
                      style={
                        niche.themeColor && !(
                          niche.themeColor.toLowerCase().includes('#1ac8ed') ||
                          niche.themeColor.toLowerCase().includes('#17b4d5') ||
                          niche.themeColor.toLowerCase().includes('#5d737e') ||
                          niche.themeColor.toLowerCase().includes('#87bba2') ||
                          niche.themeColor.toLowerCase().includes('cyan') ||
                          niche.themeColor.toLowerCase().includes('teal')
                        )
                          ? {
                              backgroundColor: niche.themeColor,
                              color: niche.textColor || '#FFFFFF',
                            }
                          : {}
                      }
                    >
                      <IconBadge
                        icon={Tag}
                        label={niche.name}
                        className="text-sm mr-2"
                      />
                      <span>{niche.name}</span>
                    </Link>
                  )}
                  {/* Category Badge */}
                  {product.category && (
                    <span className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                      {product.category}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-text-primary mb-4">
                  {product.title}
                </h1>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-text-primary">
                    ₹{product.price.toFixed(2)}
                  </span>
                </div>

                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-text-primary mb-2">
                    Description
                  </h2>
                  <p className="text-text-secondary leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Share Buttons */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-text-secondary mb-2">Share this product</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShare('twitter')}
                      className="p-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg transition-colors"
                      aria-label="Share on Twitter"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Share on Facebook"
                      type="button"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className="p-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Share on LinkedIn"
                      type="button"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Share on WhatsApp"
                      type="button"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  {isAuthenticated ? (
                    <>
                                <button
                                        onClick={() => setShowStoreModal(true)}
                                        disabled={loadingStores}
                                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-4 rounded-lg font-semibold text-lg transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                        <span className="flex items-center justify-center gap-2">
                          <IconBadge icon={ShoppingCart} label="Add to store" size="sm" variant="neutral" className="bg-black/10 border-white/30" />
                          Add to Store
                        </span>
                      </button>
                      {myStore && (
                        <button
                          onClick={() => setShowImportModal(true)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-4 rounded-lg font-semibold text-lg transition-all shadow-lg shadow-blue-500/25"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <IconBadge icon={Store} label="Import to store" size="sm" variant="neutral" className="bg-black/10 border-white/30" />
                            Import to Eazy Stores
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => setShowWriteDescription(true)}
                        className="w-full glass-card hover:bg-white/10 border-2 border-purple-500/50 text-text-primary py-4 rounded-lg font-semibold text-lg transition-all"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <IconBadge icon={PenLine} label="Write description" size="sm" variant="neutral" className="bg-black/10 border-white/30" />
                          Write Product Description (AI)
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-4 rounded-lg font-semibold text-lg transition-all shadow-lg shadow-purple-500/25"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <IconBadge icon={LogIn} label="Login to add" size="sm" variant="neutral" className="bg-black/10 border-white/30" />
                          Login to Add to Store
                        </span>
                      </button>
                      <p className="text-sm text-text-muted text-center">
                        You'll need to log in and create a store first
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-8 p-4 glass-card border border-white/10 rounded-lg">
                  <h3 className="font-semibold text-text-primary mb-2">
                    What You'll Get
                  </h3>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    {[
                      'Product added to your store',
                      'Professional descriptions & images',
                      'Ready to start selling immediately',
                      'Full control in Eazy Stores',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary-500"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-6">
            {niche ? (
              <Link
                href={`/products/niches/${niche.slug}`}
                className="text-text-primary hover:text-primary-500 font-semibold"
              >
                Back to {niche.name}
              </Link>
            ) : (
              <button
                onClick={() => router.push('/products')}
                className="text-text-primary hover:text-primary-500 font-semibold"
              >
                Back to Products
              </button>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Related Products</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                              <Link
                  key={relatedProduct._id}
                  href={`/products/${relatedProduct._id}`}
                  className="glass-card glass-card-hover rounded-xl overflow-hidden transition-all hover:-translate-y-1"
                >
                  <div className="aspect-square relative">
                    <img
                      src={relatedProduct.images[0]}
                      alt={relatedProduct.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-text-primary mb-2 line-clamp-2">
                      {relatedProduct.title}
                    </h3>
                    <p className="text-2xl font-bold text-text-primary">
                      ${relatedProduct.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {showImageZoom && product && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageZoom(false)}
        >
          <button
            className="absolute top-4 right-4 text-text-primary hover:text-text-secondary text-2xl min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            onClick={() => setShowImageZoom(false)}
            aria-label="Close zoom"
            type="button"
          >
          Close
          </button>
          <div className="max-w-4xl max-h-full">
            <img
              src={product.images[selectedImage]}
              alt={product.title}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {product.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(index);
                  }}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index
                      ? 'border-primary-500'
                      : 'border-border-default opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Store Selection Modal */}
      {isAuthenticated && (
        <>
          <StoreSelectionModal
            isOpen={showStoreModal}
            onClose={() => setShowStoreModal(false)}
            stores={stores}
            productId={params.id as string}
            onSuccess={handleStoreSuccess}
          />

          <WriteProductDescriptionModal
            isOpen={showWriteDescription}
            onClose={() => setShowWriteDescription(false)}
            productId={params.id as string}
            productTitle={product?.title}
          />

          {showImportModal && myStore && product && (
            <ImportProductModal
              product={{
                _id: product._id,
                title: product.title,
                description: product.description,
                price: product.price,
                images: product.images,
                niche: typeof product.niche === 'object' ? product.niche : undefined,
              }}
              store={myStore}
              onClose={() => setShowImportModal(false)}
              onSuccess={() => {
                setShowImportModal(false);
                notify.success('Product imported to your store successfully!');
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
