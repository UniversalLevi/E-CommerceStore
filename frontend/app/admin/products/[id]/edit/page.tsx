'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Product, Niche } from '@/types';
import Navbar from '@/components/Navbar';

export default function EditProductPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    niche: '',
    images: [''],
    active: true,
  });
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loadingNiches, setLoadingNiches] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchNiches();
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  const fetchNiches = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Niche[] }>(
        '/api/admin/niches?active=true'
      );
      setNiches(response.data);
    } catch (err: any) {
      console.error('Error fetching niches:', err);
    } finally {
      setLoadingNiches(false);
    }
  };

  const fetchProduct = async (id: string) => {
    try {
      const response = await api.get<{ success: boolean; data: Product }>(
        `/api/products/${id}`
      );
      const product = response.data;
      const nicheId =
        typeof product.niche === 'object' ? product.niche._id : product.niche;
      setFormData({
        title: product.title,
        description: product.description,
        price: product.price.toString(),
        category: product.category || '',
        niche: nicheId || '',
        images: product.images,
        active: product.active,
      });
    } catch (err: any) {
      setError('Failed to load product');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        images: formData.images.filter((img) => img.trim() !== ''),
      };

      await api.put(`/api/products/${params.id}`, productData);
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const addImageField = () => {
    setFormData({
      ...formData,
      images: [...formData.images, ''],
    });
  };

  const updateImage = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const removeImage = (index: number) => {
    if (formData.images.length > 1) {
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData({ ...formData, images: newImages });
    }
  };

  if (loading || loadingProduct) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Edit Product
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                minLength={3}
                maxLength={200}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                minLength={10}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niche *
              </label>
              {loadingNiches ? (
                <div className="text-sm text-gray-500">Loading niches...</div>
              ) : (
                <select
                  value={formData.niche}
                  onChange={(e) =>
                    setFormData({ ...formData, niche: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a niche</option>
                  {niches.map((niche) => (
                    <option key={niche._id} value={niche._id}>
                      {niche.icon && <span>{niche.icon} </span>}
                      {niche.name}
                      {niche.isDefault && ' (Default)'}
                    </option>
                  ))}
                </select>
              )}
              {!formData.niche && !loadingNiches && (
                <p className="mt-1 text-sm text-red-600">
                  Please select a niche for this product
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images (URLs) *
              </label>
              {formData.images.map((image, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => updateImage(index, e.target.value)}
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {formData.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageField}
                className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                + Add Another Image
              </button>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                Product is active and visible to users
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update Product'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

