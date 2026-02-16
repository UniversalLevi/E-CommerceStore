'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import ProductImage from '@/components/ProductImage';
import { notify } from '@/lib/toast';
import { X, Loader2, Package } from 'lucide-react';

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  niche?: {
    _id: string;
    name: string;
    slug: string;
    icon?: string;
  };
}

interface Store {
  _id: string;
  currency: string;
}

interface ImportProductModalProps {
  product: Product;
  store: Store;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportProductModal({
  product,
  store,
  onClose,
  onSuccess,
}: ImportProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [basePrice, setBasePrice] = useState(product.price);
  const [status, setStatus] = useState<'draft' | 'active'>('draft');
  const [variantDimension, setVariantDimension] = useState('');
  const [variants, setVariants] = useState<Array<{ name: string; price?: number; inventory?: number | null }>>([]);
  const [productDetails, setProductDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    fetchProductDetails();
  }, []);

  const fetchProductDetails = async () => {
    try {
      setLoadingDetails(true);
      const response = await api.getCatalogProductDetails(store._id, product._id);
      if (response.success) {
        setProductDetails(response.data);
        if (response.data.importWarnings && response.data.importWarnings.length > 0) {
          response.data.importWarnings.forEach((warning: string) => {
            notify.warning(warning);
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching product details:', error);
      notify.error('Failed to load product details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddVariant = () => {
    setVariants([...variants, { name: '', price: undefined, inventory: null }]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleImport = async () => {
    if (variants.some((v) => !v.name.trim())) {
      notify.error('All variants must have a name');
      return;
    }

    try {
      setLoading(true);
      const importData: any = {
        catalogProductId: product._id,
        basePrice: basePrice,
        status,
      };

      if (variantDimension && variants.length > 0) {
        importData.variantDimension = variantDimension;
        importData.variants = variants.map((v) => ({
          name: v.name,
          price: v.price || undefined,
          inventory: v.inventory !== undefined ? v.inventory : null,
        }));
      }

      const response = await api.importProduct(store._id, importData);
      if (response.success) {
        notify.success('Product imported successfully');
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error importing product:', error);
      notify.error(error.response?.data?.message || 'Failed to import product');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    const currencySymbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    const symbol = currencySymbols[store.currency] || store.currency || '₹';
    return `${symbol}${price.toFixed(2)}`;
  };

  if (loadingDetails) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-surface-raised rounded-lg p-6">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  const canImport = productDetails?.canImport !== false;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-raised rounded-lg border border-border-default max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default">
          <h2 className="text-xl font-bold text-text-primary">Import Product</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Preview */}
          <div className="flex gap-4">
            {product.images && product.images.length > 0 && (
              <ProductImage
                src={product.images[0]}
                alt={product.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary mb-2">{product.title}</h3>
              {product.niche && (
                <div className="text-sm text-text-secondary mb-2">
                  {product.niche.icon} {product.niche.name}
                </div>
              )}
              <div className="text-lg font-bold text-purple-500">
                Catalog Price: {formatPrice(product.price)}
              </div>
            </div>
          </div>

          {!canImport && productDetails && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{productDetails.error || 'Cannot import this product'}</p>
            </div>
          )}

          {/* Price Adjustment */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Base Price ({store.currency})
            </label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 bg-surface-default border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-text-secondary mt-1">
              You can adjust the price after import. Default: {formatPrice(product.price)}
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'active')}
              className="w-full px-4 py-2 bg-surface-default border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>

          {/* Variants (Optional) */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Variants (Optional)
            </label>
            <input
              type="text"
              placeholder="Variant dimension (e.g., Size, Color)"
              value={variantDimension}
              onChange={(e) => setVariantDimension(e.target.value)}
              className="w-full px-4 py-2 bg-surface-default border border-border-default rounded-lg text-text-primary mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {variants.length > 0 && (
              <div className="space-y-2 mb-2">
                {variants.map((variant, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Variant name"
                      value={variant.name}
                      onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                      className="flex-1 px-4 py-2 bg-surface-default border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={variant.price || ''}
                      onChange={(e) =>
                        handleVariantChange(index, 'price', e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                      min="0"
                      step="0.01"
                      className="w-24 px-4 py-2 bg-surface-default border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={variant.inventory !== null && variant.inventory !== undefined ? variant.inventory : ''}
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          'inventory',
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      min="0"
                      className="w-24 px-4 py-2 bg-surface-default border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => handleRemoveVariant(index)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {variantDimension && (
              <button
                onClick={handleAddVariant}
                className="text-sm text-purple-500 hover:text-purple-400"
              >
                + Add Variant
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-border-default">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-default text-text-secondary rounded-lg hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !canImport}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Import Product
          </button>
        </div>
      </div>
    </div>
  );
}
