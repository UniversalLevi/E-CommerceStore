'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [storeData, setStoreData] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  const fetchProduct = async (id: string) => {
    try {
      const response = await api.get<{ success: boolean; data: Product }>(
        `/api/products/${id}`
      );
      setProduct(response.data);
    } catch (err: any) {
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!user?.shopifyShop) {
      alert('Please connect your Shopify account first from your dashboard');
      router.push('/dashboard');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        data: any;
      }>('/api/stores/create', {
        productId: params.id,
      });

      setStoreData(response.data);
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          'Failed to create store. Please try again.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Product Not Found
          </h2>
          <button
            onClick={() => router.push('/products')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Success Modal */}
      {showSuccessModal && storeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Store Created Successfully!
              </h2>
              <p className="text-gray-600">
                Your Shopify store is now live with the selected product
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store URL
                </label>
                <a
                  href={storeData.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 break-all"
                >
                  {storeData.storeUrl}
                </a>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product URL
                </label>
                <a
                  href={storeData.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 break-all"
                >
                  {storeData.productUrl}
                </a>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Panel
                </label>
                <a
                  href={storeData.adminUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 break-all"
                >
                  Manage Product
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Images */}
              <div>
                <div className="aspect-square rounded-lg overflow-hidden mb-4">
                  <img
                    src={product.images[selectedImage]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImage === index
                            ? 'border-primary-600'
                            : 'border-gray-200 hover:border-gray-300'
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
                <div className="mb-2">
                  <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                    {product.category}
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.title}
                </h1>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary-600">
                    ${product.price.toFixed(2)}
                  </span>
                </div>

                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Description
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <button
                    onClick={handleCreateStore}
                    disabled={creating}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating Your Store...
                      </span>
                    ) : (
                      '🚀 Create My Store with This Product'
                    )}
                  </button>

                  {!isAuthenticated && (
                    <p className="text-sm text-gray-500 text-center">
                      You'll need to log in and connect Shopify to create a store
                    </p>
                  )}

                  {isAuthenticated && !user?.shopifyShop && (
                    <p className="text-sm text-orange-600 text-center">
                      ⚠️ Connect your Shopify account first
                    </p>
                  )}
                </div>

                <div className="mt-8 p-4 bg-primary-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    ✨ What You'll Get
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ Fully functional Shopify store</li>
                    <li>✓ Product automatically added</li>
                    <li>✓ Professional descriptions & images</li>
                    <li>✓ Ready to start selling immediately</li>
                    <li>✓ AI-generated marketing tips</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-6">
            <button
              onClick={() => router.push('/products')}
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              ← Back to Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

