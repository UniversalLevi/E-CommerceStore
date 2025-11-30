'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Product, Niche } from '@/types';
import { notify } from '@/lib/toast';
import LoadingScreen from '@/components/LoadingScreen';

export default function AdminProductsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingNiches, setLoadingNiches] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchNiches();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedNiche]);

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

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const params = new URLSearchParams();
      if (selectedNiche && selectedNiche !== 'all') {
        params.append('niche', selectedNiche);
      }

      const response = await api.get<{ success: boolean; data: Product[] }>(
        `/api/products?${params.toString()}`
      );
      setProducts(response.data);
    } catch (err: any) {
      setError('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/api/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
    } catch (err: any) {
      notify.error('Failed to delete product');
    }
  };

  if (loading || loadingProducts) {
    return <LoadingScreen />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">
            Product Management
          </h1>
          <Link
            href="/admin/products/new"
            className="bg-primary-500 hover:bg-primary-600 text-black px-6 py-3 rounded-lg transition-colors"
          >
            + Add Product
          </Link>
        </div>

        {/* Niche Filter */}
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-text-secondary">Filter by Niche:</label>
          <select
            value={selectedNiche}
            onChange={(e) => setSelectedNiche(e.target.value)}
            className="px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="all">All Niches</option>
            {niches.map((niche) => (
              <option key={niche._id} value={niche._id}>
                {niche.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-12 text-center">
            <p className="text-text-secondary mb-4">No products yet</p>
            <Link
              href="/admin/products/new"
              className="inline-block bg-primary-500 hover:bg-primary-600 text-black px-6 py-3 rounded-lg transition-colors"
            >
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
              <thead className="bg-surface-elevated border-b border-border-default">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Niche
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-surface-hover">
                    <td className="px-3 md:px-6 py-4">
                      <div className="flex items-center">
                        {product.images?.[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-10 h-10 md:w-12 md:h-12 object-cover rounded"
                        />
                        )}
                        <div className="ml-2 md:ml-4">
                          <div className="text-sm font-medium text-text-primary">
                            {product.title}
                          </div>
                          <div className="text-xs md:text-sm text-text-muted hidden md:block">
                            {product.description?.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4">
                      {product.niche && typeof product.niche === 'object' ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-primary-500 text-black cursor-pointer hover:bg-primary-600"
                          onClick={() => setSelectedNiche((product.niche as any)._id)}
                        >
                          {(product.niche as any).icon && <span>{(product.niche as any).icon}</span>}
                          {(product.niche as any).name}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-4 text-sm text-text-secondary capitalize">
                      {product.category || '-'}
                    </td>
                    <td className="px-3 md:px-6 py-4 text-sm text-text-primary">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-3 md:px-6 py-4">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.active
                            ? 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/50'
                            : 'bg-accent-500/20 text-accent-400 border border-accent-500/50'
                        }`}
                      >
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-4 text-right text-sm font-medium">
                      <div className="flex flex-col md:flex-row gap-2 md:gap-0 md:justify-end">
                      <Link
                        href={`/admin/products/${product._id}/edit`}
                          className="text-primary-500 hover:text-primary-600 md:mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
    </div>
  );
}

