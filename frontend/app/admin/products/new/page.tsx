'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Niche } from '@/types';
import Navbar from '@/components/Navbar';
import ImageUploader from '@/components/ImageUploader';

export default function NewProductPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    basePrice: string;
    profit: string;
    shippingPrice: string;
    category: string;
    niche: string;
    images: string[];
    active: boolean;
  }>({
    title: '',
    description: '',
    basePrice: '',
    profit: '0',
    shippingPrice: '0',
    category: '',
    niche: '',
    images: [],
    active: true,
  });
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loadingNiches, setLoadingNiches] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchNiches();
  }, []);

  const fetchNiches = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Niche[] }>(
        '/api/admin/niches?active=true'
      );
      setNiches(response.data);
      // Auto-select default niche if exists
      const defaultNiche = response.data.find((n) => n.isDefault);
      if (defaultNiche) {
        setFormData((prev) => ({ ...prev, niche: defaultNiche._id }));
      }
    } catch (err: any) {
      console.error('Error fetching niches:', err);
    } finally {
      setLoadingNiches(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const productData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        profit: parseFloat(formData.profit) || 0,
        shippingPrice: parseFloat(formData.shippingPrice) || 0,
        images: formData.images,
      };

      await api.post('/api/products', productData);
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
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
            Add New Product
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
                placeholder="Wireless Bluetooth Headphones"
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
                placeholder="Detailed product description..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Base Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.basePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, basePrice: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="20.00"
                />
                <p className="mt-1 text-xs text-text-muted">Cost price of the product</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Profit ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.profit}
                  onChange={(e) =>
                    setFormData({ ...formData, profit: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="5.00"
                />
                <p className="mt-1 text-xs text-text-muted">Profit margin</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Shipping Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.shippingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, shippingPrice: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="4.99"
                />
                <p className="mt-1 text-xs text-text-muted">Shipping cost</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Final Price ($)
                </label>
                <div className="w-full px-4 py-2 bg-surface-elevated/50 border border-border-default text-text-primary rounded-lg">
                  ${(
                    (parseFloat(formData.basePrice) || 0) +
                    (parseFloat(formData.profit) || 0) +
                    (parseFloat(formData.shippingPrice) || 0)
                  ).toFixed(2)}
                </div>
                <p className="mt-1 text-xs text-text-muted">Auto-calculated: Base + Profit + Shipping</p>
              </div>
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
                placeholder="electronics"
              />
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
                {submitting ? 'Creating...' : 'Create Product'}
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

