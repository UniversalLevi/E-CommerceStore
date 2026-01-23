'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Package, Plus, Loader2, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function StoreProductsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchData();
    }
  }, [authLoading, isAuthenticated, router, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const storeResponse = await api.getMyStore();
      if (storeResponse.success && storeResponse.data) {
        setStore(storeResponse.data);
        const productsResponse = await api.getStoreProducts(storeResponse.data._id, {
          status: statusFilter === 'all' ? undefined : statusFilter,
        });
        if (productsResponse.success) {
          setProducts(productsResponse.data.products || []);
        }
      } else {
        router.push('/dashboard/store');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await api.deleteStoreProduct(store!._id, productId);
      if (response.success) {
        notify.success('Product deleted successfully');
        fetchData();
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleToggleStatus = async (product: any) => {
    try {
      const newStatus = product.status === 'active' ? 'draft' : 'active';
      await api.updateStoreProduct(store!._id, product._id, { status: newStatus });
      notify.success(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to update product');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!store) {
    return null;
  }

  const formatPrice = (price: number) => {
    const currencySymbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    const symbol = currencySymbols[store.currency] || store.currency;
    return `${symbol}${(price / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Products</h1>
        <Link
          href="/dashboard/store/products/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </Link>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            statusFilter === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-surface-raised text-text-secondary hover:bg-surface-hover'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            statusFilter === 'active'
              ? 'bg-purple-600 text-white'
              : 'bg-surface-raised text-text-secondary hover:bg-surface-hover'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            statusFilter === 'draft'
              ? 'bg-purple-600 text-white'
              : 'bg-surface-raised text-text-secondary hover:bg-surface-hover'
          }`}
        >
          Draft
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-surface-raised rounded-lg border border-border-default p-12 text-center">
          <Package className="h-12 w-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No products yet</h3>
          <p className="text-text-secondary mb-4">Get started by adding your first product</p>
          <Link
            href="/dashboard/store/products/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <Plus className="h-5 w-5" />
            Add Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-surface-raised rounded-lg border border-border-default p-4"
            >
              {product.images && product.images.length > 0 && (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="font-semibold text-text-primary mb-2">{product.title}</h3>
              <p className="text-lg font-bold text-purple-500 mb-4">{formatPrice(product.basePrice)}</p>
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    product.status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {product.status}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleStatus(product)}
                    className="p-2 hover:bg-surface-hover rounded transition-colors"
                    title={product.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    {product.status === 'active' ? (
                      <EyeOff className="h-4 w-4 text-text-secondary" />
                    ) : (
                      <Eye className="h-4 w-4 text-text-secondary" />
                    )}
                  </button>
                  <Link
                    href={`/dashboard/store/products/${product._id}/edit`}
                    className="p-2 hover:bg-surface-hover rounded transition-colors"
                  >
                    <Edit className="h-4 w-4 text-text-secondary" />
                  </Link>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="p-2 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
