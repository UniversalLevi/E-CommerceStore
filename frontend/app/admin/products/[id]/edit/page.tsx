'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Product, Niche } from '@/types';
import Navbar from '@/components/Navbar';
import ImageUploader from '@/components/ImageUploader';

export default function EditProductPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    price: string;
    category: string;
    niche: string;
    images: string[];
    active: boolean;
  }>({
    title: '',
    description: '',
    price: '',
    category: '',
    niche: '',
    images: [],
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
        images: Array.isArray(product.images) ? product.images : [],
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
        images: formData.images,
      };

      await api.put(`/api/products/${params.id}`, productData);
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };


  if (loading || loadingProduct) {
    return (
      <div className="min-h-screen bg-surface-base">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-6">
            Edit Product
          </h1>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
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
                className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
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
                className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
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
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Niche *
              </label>
              {loadingNiches ? (
                <div className="text-sm text-text-muted">Loading niches...</div>
              ) : (
                <select
                  value={formData.niche}
                  onChange={(e) =>
                    setFormData({ ...formData, niche: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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
                <p className="mt-1 text-sm text-red-400">
                  Please select a niche for this product
                </p>
              )}
            </div>

            <ImageUploader
              value={formData.images}
              onChange={(urls) => setFormData({ ...formData, images: urls })}
              multiple={true}
              maxFiles={10}
              label="Product Images"
              required={true}
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
                className="w-4 h-4 text-primary-500 border-border-default rounded focus:ring-primary-500 bg-surface-elevated"
              />
              <label htmlFor="active" className="ml-2 text-sm text-text-secondary">
                Product is active and visible to users
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-black py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update Product'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-surface-elevated hover:bg-surface-hover text-text-primary rounded-lg transition-colors"
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

