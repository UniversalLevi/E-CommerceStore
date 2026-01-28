'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Package, Plus, Loader2, Edit, Trash2, Eye, EyeOff, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function StoreProductsPage() {
  const { store } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (store) {
      fetchData();
    }
  }, [store, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (store) {
        const productsResponse = await api.getStoreProducts(store._id, {
          status: statusFilter === 'all' ? undefined : statusFilter,
        });
        if (productsResponse.success) {
          setProducts(productsResponse.data.products || []);
        }
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

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Products</h1>
          <p className="text-sm text-text-secondary mt-1">Manage your store products</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-raised border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition-all text-sm font-medium"
          >
            <Package className="h-4 w-4" />
            Browse Catalog
          </Link>
          <Link
            href="/dashboard/store/products/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-base border border-border-default rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${
              statusFilter === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-surface-raised border border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${
              statusFilter === 'active'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-surface-raised border border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${
              statusFilter === 'draft'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-surface-raised border border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            Draft
          </button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-surface-raised rounded-xl border border-border-default p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No products found</h3>
          <p className="text-text-secondary mb-6">
            {searchQuery ? 'Try adjusting your search query' : 'Get started by importing from the catalog or adding a new product'}
          </p>
          {!searchQuery && (
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-raised border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition-all font-medium"
              >
                <Package className="h-5 w-5" />
                Browse Catalog
              </Link>
              <Link
                href="/dashboard/store/products/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25 font-medium"
              >
                <Plus className="h-5 w-5" />
                Add Product
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="group bg-surface-raised rounded-xl border border-border-default overflow-hidden hover:border-purple-500/50 hover:shadow-xl transition-all duration-200"
            >
              {product.images && product.images.length > 0 && (
                <div className="relative w-full h-48 overflow-hidden bg-surface-base">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        product.status === 'active'
                          ? 'bg-green-500/90 text-white'
                          : 'bg-gray-500/90 text-white'
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                </div>
              )}
              <div className="p-5">
                <h3 className="font-semibold text-text-primary mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                  {product.title}
                </h3>
                <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                  {formatPrice(product.basePrice)}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-border-default">
                  <button
                    onClick={() => handleToggleStatus(product)}
                    className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                    title={product.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    {product.status === 'active' ? (
                      <EyeOff className="h-4 w-4 text-text-secondary hover:text-purple-400 transition-colors" />
                    ) : (
                      <Eye className="h-4 w-4 text-text-secondary hover:text-purple-400 transition-colors" />
                    )}
                  </button>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/store/products/${product._id}/edit`}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4 text-text-secondary hover:text-blue-400 transition-colors" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-text-secondary hover:text-red-400 transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
