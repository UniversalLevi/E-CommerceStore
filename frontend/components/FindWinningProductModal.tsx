'use client';

import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';
import Button from './Button';
import StoreSelectionModal from './StoreSelectionModal';

interface FindWinningProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowOnboarding?: () => void;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  niche?: {
    _id: string;
    name: string;
    icon?: string;
  };
  costPrice?: number;
  tags?: string[];
  supplierLink?: string;
}

interface Recommendation {
  productId: string;
  product: Product;
  score: number;
  confidence: number;
  rationale: string[];
  breakdown: {
    nicheRelevance: number;
    beginnerFriendliness: number;
    profitMargin: number;
    quality: number;
    popularity: number;
  };
  actionLinks: {
    import: string;
    writeDescription: string;
  };
  note?: string;
  crossNiche?: boolean;
}

export default function FindWinningProductModal({
  isOpen,
  onClose,
  onShowOnboarding,
}: FindWinningProductModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [top3, setTop3] = useState<Recommendation[]>([]);
  const [showTop3, setShowTop3] = useState(false);
  const [error, setError] = useState('');
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const handleFindProduct = async (mode: 'single' | 'top3' = 'single') => {
    try {
      setLoading(true);
      setError('');
      setRecommendation(null);
      setTop3([]);
      setShowTop3(false);

      const response = await api.post<{ success: boolean; data: Recommendation | Recommendation[]; crossNiche?: boolean }>(
        '/api/ai/find-winning-product',
        { mode }
      );

      if (mode === 'top3' || Array.isArray(response.data)) {
        setTop3(response.data as Recommendation[]);
        setShowTop3(true);
      } else {
        setRecommendation(response.data as Recommendation);
      }
    } catch (error: any) {
      console.error('Failed to find winning product:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to find winning product';
      setError(errorMessage);
      
      if (errorMessage.includes('niche')) {
        notify.error('Please complete onboarding and select a niche first');
      } else {
        notify.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (productId: string) => {
    try {
      // Check subscription status and product credits
      const [planResponse, storesResponse] = await Promise.all([
        api.getCurrentPlan().catch(() => ({ data: { plan: null, productsAdded: 0, productLimit: 0 } })),
        api.get<{ success: boolean; data: any[] }>('/api/stores').catch(() => ({ data: [] })),
      ]);

      const planData = planResponse.data || {};
      const userStores = storesResponse.data || [];

      // Check if user has active plan and credits
      const hasActivePlan = planData.plan && planData.plan !== 'free';
      const hasCredits = hasActivePlan && planData.productsAdded < planData.productLimit;

      if (!hasActivePlan) {
        notify.error('Please subscribe to a plan to add products to your store');
        router.push('/dashboard/billing');
        onClose();
        return;
      }

      if (!hasCredits) {
        notify.error('You have reached your product limit. Please upgrade your plan.');
        router.push('/dashboard/billing');
        onClose();
        return;
      }

      if (userStores.length === 0) {
        notify.error('Please connect a Shopify store first');
        router.push('/dashboard/stores/connect');
        onClose();
        return;
      }

      // Track import
      await api.post('/api/analytics/product-import', { productId });

      // Open store selection modal
      setStores(userStores);
      setSelectedProductId(productId);
      setShowStoreModal(true);
    } catch (error: any) {
      console.error('Failed to import product:', error);
      notify.error('Failed to import product. Please try again.');
    }
  };

  const handleStoreSuccess = (data: any) => {
    notify.success('Product added to store successfully!');
    setShowStoreModal(false);
    onClose();
  };

  return (
    <>
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl mx-4 transform overflow-hidden rounded-2xl glass-card border border-white/10 p-4 md:p-6 lg:p-8 text-left align-middle shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-2xl font-bold text-text-primary">
                    Find Winning Product
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-text-muted hover:text-text-primary text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {!recommendation && !showTop3 && !loading && !error && (
                  <div className="text-center py-8">
                    <p className="text-text-secondary mb-6">
                      We'll analyze our product catalog and recommend the best product for you based on your niche and goals.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button onClick={() => handleFindProduct('single')}>
                        Find Best Product
                      </Button>
                      <Button variant="secondary" onClick={() => handleFindProduct('top3')}>
                        Show Top 3
                      </Button>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-text-secondary">Finding a great product for you...</p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
                    <p className="font-semibold mb-2">Unable to find product</p>
                    <p className="text-sm">{error}</p>
                    {error.includes('niche') && (
                      <button
                        onClick={() => {
                          onClose();
                          if (onShowOnboarding) {
                            onShowOnboarding();
                          } else {
                            router.push('/dashboard');
                          }
                        }}
                        className="text-sm underline mt-2 inline-block text-primary-500 hover:text-primary-400"
                      >
                        Complete onboarding →
                      </button>
                    )}
                  </div>
                )}

                {recommendation && !showTop3 && (
                  <div className="space-y-6">
                    {recommendation.note && (
                      <div className="bg-surface-hover border border-border-default rounded-lg p-4">
                        <p className="text-sm text-text-secondary">{recommendation.note}</p>
                      </div>
                    )}

                    {/* Product Card */}
                    <div className="bg-surface-base border border-border-default rounded-xl p-6">
                      <div className="flex gap-6">
                        {recommendation.product.images?.[0] && (
                          <img
                            src={recommendation.product.images[0]}
                            alt={recommendation.product.title}
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-xl font-bold text-text-primary">
                              {recommendation.product.title}
                            </h4>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-text-primary">
                                ₹{recommendation.product.price}
                              </div>
                              {recommendation.product.costPrice && (
                                <div className="text-sm text-text-muted">
                                  Cost: ₹{recommendation.product.costPrice}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mb-4">
                            <div>
                              <div className="text-sm text-text-secondary">Score</div>
                              <div className="text-lg font-bold text-primary-500">
                                {recommendation.score}/100
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-text-secondary">Confidence</div>
                              <div className="text-lg font-bold text-text-primary">
                                {Math.round(recommendation.confidence * 100)}%
                              </div>
                            </div>
                          </div>

                          {/* Rationale */}
                          <div className="mb-4">
                            <h5 className="text-sm font-semibold text-text-secondary mb-2">
                              Why this product?
                            </h5>
                            <ul className="space-y-1">
                              {recommendation.rationale.map((bullet, index) => (
                                <li key={index} className="text-sm text-text-secondary flex items-start gap-2">
                                  <span className="text-primary-500 mt-1">•</span>
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 mt-6">
                            <Button
                              onClick={() => handleImport(recommendation.productId)}
                              className="flex-1"
                            >
                              Import to Store
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setShowTop3(true);
                                handleFindProduct('top3');
                              }}
                            >
                              See Top 3
                            </Button>
                            <Link
                              href={`/products/${recommendation.productId}`}
                              className="flex-1"
                            >
                              <Button variant="secondary" className="w-full">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showTop3 && top3.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-bold text-text-primary">Top 3 Recommendations</h4>
                      <button
                        onClick={() => {
                          setShowTop3(false);
                          setTop3([]);
                        }}
                        className="text-text-secondary hover:text-text-primary text-sm"
                      >
                        Show Single
                      </button>
                    </div>

                    <div className="space-y-4">
                      {top3.map((rec, index) => (
                        <div
                          key={rec.productId}
                          className="bg-surface-base border border-border-default rounded-xl p-6"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary-500 text-black flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <h5 className="text-lg font-bold text-text-primary">
                                  {rec.product.title}
                                </h5>
                                <div className="text-sm text-text-secondary">
                                  Score: {rec.score}/100 • Confidence: {Math.round(rec.confidence * 100)}%
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-text-primary">
                                ₹{rec.product.price}
                              </div>
                            </div>
                          </div>

                          {rec.product.images?.[0] && (
                            <img
                              src={rec.product.images[0]}
                              alt={rec.product.title}
                              className="w-full h-48 object-cover rounded-lg mb-4"
                            />
                          )}

                          <div className="mb-4">
                            <h6 className="text-sm font-semibold text-text-secondary mb-2">
                              Why this product?
                            </h6>
                            <ul className="space-y-1">
                              {rec.rationale.map((bullet, idx) => (
                                <li key={idx} className="text-sm text-text-secondary flex items-start gap-2">
                                  <span className="text-primary-500 mt-1">•</span>
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleImport(rec.productId)}
                              className="flex-1"
                            >
                              Import
                            </Button>
                            <Link href={`/products/${rec.productId}`} className="flex-1">
                              <Button variant="secondary" className="w-full">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
    {showStoreModal && selectedProductId && (
      <StoreSelectionModal
        isOpen={showStoreModal}
        onClose={() => {
          setShowStoreModal(false);
          setSelectedProductId('');
        }}
        stores={stores}
        productId={selectedProductId}
        onSuccess={handleStoreSuccess}
      />
    )}
    </>
  );
}

