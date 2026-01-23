'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    basePrice: '',
    status: 'draft' as 'draft' | 'active',
    images: [] as string[],
    variantDimension: '',
    variants: [] as Array<{ name: string; price?: string; inventory?: string | null }>,
    inventoryTracking: false,
  });
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, router, productId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const storeResponse = await api.getMyStore();
      if (storeResponse.success && storeResponse.data) {
        setStore(storeResponse.data);
        const productResponse = await api.getStoreProduct(storeResponse.data._id, productId);
        if (productResponse.success && productResponse.data) {
          const product = productResponse.data;
          setFormData({
            title: product.title,
            description: product.description || '',
            basePrice: (product.basePrice / 100).toFixed(2),
            status: product.status,
            images: product.images || [],
            variantDimension: product.variantDimension || '',
            variants: (product.variants || []).map((v: any) => ({
              name: v.name,
              price: v.price ? (v.price / 100).toFixed(2) : '',
              inventory: v.inventory !== null && v.inventory !== undefined ? v.inventory : null,
            })),
            inventoryTracking: product.inventoryTracking || false,
          });
        }
      } else {
        router.push('/dashboard/store');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      notify.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    if (imageUrl.trim() && formData.images.length < 5) {
      setFormData({
        ...formData,
        images: [...formData.images, imageUrl.trim()],
      });
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleAddVariant = () => {
    if (formData.variantDimension) {
      setFormData({
        ...formData,
        variants: [...formData.variants, { name: '', price: '', inventory: null }],
      });
    } else {
      notify.error('Please enter variant dimension name first');
    }
  };

  const handleRemoveVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const handleVariantChange = (index: number, field: string, value: string) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: field === 'inventory' ? (value === '' ? null : parseInt(value, 10)) : value,
    };
    setFormData({ ...formData, variants: updatedVariants });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    try {
      setSaving(true);

      if (formData.images.length === 0) {
        notify.error('Please add at least one product image');
        return;
      }

      const productData = {
        title: formData.title,
        description: formData.description,
        basePrice: Math.round(parseFloat(formData.basePrice) * 100),
        status: formData.status,
        images: formData.images,
        variantDimension: formData.variantDimension || undefined,
        variants: formData.variants.map((v) => ({
          name: v.name,
          price: v.price ? Math.round(parseFloat(v.price) * 100) : undefined,
          inventory: v.inventory !== null && v.inventory !== undefined ? v.inventory : null,
        })),
        inventoryTracking: formData.inventoryTracking,
      };

      const response = await api.updateStoreProduct(store._id, productId, productData);
      if (response.success) {
        notify.success('Product updated successfully!');
        router.push('/dashboard/store/products');
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!store) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    return currencySymbols[store.currency] || store.currency;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/dashboard/store/products"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="bg-surface-raised rounded-lg border border-border-default p-6">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Edit Product</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Same form fields as create page */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Base Price ({formatCurrency(0)}) *
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
              className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Product Images (Max 5) *
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImage();
                  }
                }}
                className="flex-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter image URL"
                disabled={formData.images.length >= 5}
              />
              <button
                type="button"
                onClick={handleAddImage}
                disabled={formData.images.length >= 5 || !imageUrl.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            {formData.images.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative">
                    <img src={url} alt={`Product ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-text-secondary mt-1">
              {formData.images.length} / 5 images
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Variant Dimension (Optional)
            </label>
            <input
              type="text"
              value={formData.variantDimension}
              onChange={(e) => setFormData({ ...formData, variantDimension: e.target.value })}
              className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Size, Color"
            />
          </div>

          {formData.variantDimension && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-text-primary">
                  Variants *
                </label>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                >
                  <Plus className="h-4 w-4 inline mr-1" />
                  Add Variant
                </button>
              </div>
              {formData.variants.map((variant, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                  <input
                    type="text"
                    required
                    value={variant.name}
                    onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                    className="px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
                    placeholder="Variant name"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={variant.price || ''}
                    onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                    className="px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
                    placeholder="Price (optional)"
                  />
                  <input
                    type="number"
                    min="0"
                    value={variant.inventory !== null ? variant.inventory : ''}
                    onChange={(e) => handleVariantChange(index, 'inventory', e.target.value)}
                    className="px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
                    placeholder="Inventory (optional)"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(index)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <X className="h-4 w-4 inline" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="inventoryTracking"
              checked={formData.inventoryTracking}
              onChange={(e) => setFormData({ ...formData, inventoryTracking: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="inventoryTracking" className="text-sm text-text-primary">
              Enable inventory tracking
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'active' })}
              className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
            <Link
              href="/dashboard/store/products"
              className="px-6 py-3 bg-surface-base border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
