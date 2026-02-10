'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionLock from '@/components/SubscriptionLock';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';

export default function CreateStorePage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    currency: 'INR',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Check subscription before rendering
  if (!authLoading && isAuthenticated && !hasActiveSubscription) {
    return <SubscriptionLock featureName="Create Store" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post<{ success: boolean; data: any }>('/api/stores', {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        currency: formData.currency,
      });

      notify.success('Store created successfully!');
      router.push('/dashboard/stores');
    } catch (error: any) {
      console.error('Error creating store:', error);
      setError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to create store. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: formData.slug || name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
    });
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-[#1AC8ED]">
              EazyDS
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard/stores" className="text-gray-300 hover:text-white">
                Back to Stores
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Create Your Store
          </h1>
          <p className="text-text-secondary mb-8">
            Set up your internal store to start selling products
          </p>

          {error && (
            <div className="mb-6 bg-red-900 bg-opacity-20 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-xl shadow-md p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Store Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                placeholder="My Awesome Store"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-[#1AC8ED] focus:border-[#1AC8ED] placeholder-gray-500"
              />
              <p className="mt-1 text-sm text-gray-400">
                A friendly name to identify your store
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Store URL Slug <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2 items-center">
                <span className="text-gray-400 text-sm">https://</span>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') })}
                  placeholder="my-store"
                  className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-[#1AC8ED] focus:border-[#1AC8ED] placeholder-gray-500"
                />
                <span className="text-gray-400 text-sm">.eazyds.com</span>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                Your store's unique URL identifier (lowercase letters, numbers, and hyphens only)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Currency <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-[#1AC8ED] focus:border-[#1AC8ED]"
              >
                <option value="INR">INR (Indian Rupee)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
              </select>
              <p className="mt-1 text-sm text-gray-400">
                Default currency for your store
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#1AC8ED] hover:bg-[#0FA8C7] text-black py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
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
                    Creating Store...
                  </span>
                ) : (
                  'Create Store'
                )}
              </button>

              <Link
                href="/dashboard/stores"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
