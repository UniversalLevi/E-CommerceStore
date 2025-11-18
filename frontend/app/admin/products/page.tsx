'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Product, Niche } from '@/types';
import Navbar from '@/components/Navbar';
import { notify } from '@/lib/toast';

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Product Management
          </h1>
          <Link
            href="/admin/products/new"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            + Add Product
          </Link>
        </div>

        {/* Niche Filter */}
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Niche:</label>
          <select
            value={selectedNiche}
            onChange={(e) => setSelectedNiche(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">No products yet</p>
            <Link
              href="/admin/products/new"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Niche
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.description.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.niche && typeof product.niche === 'object' ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800 cursor-pointer hover:bg-primary-200"
                          onClick={() => setSelectedNiche(product.niche._id)}
                        >
                          {product.niche.icon && <span>{product.niche.icon}</span>}
                          {product.niche.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                      {product.category || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/admin/products/${product._id}/edit`}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

