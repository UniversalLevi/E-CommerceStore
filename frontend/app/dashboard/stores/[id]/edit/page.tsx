'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';

export default function EditStorePage() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.id as string;

  const [formData, setFormData] = useState({
    storeName: '',
    shopDomain: '',
    accessToken: '',
    apiKey: '',
    apiSecret: '',
    environment: 'production' as 'production' | 'development',
    isDefault: false,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStoreData();
  }, [storeId]);

  const fetchStoreData = async () => {
    try {
      setFetching(true);
      const response = await api.get<{ success: boolean; data: any }>(`/api/stores/${storeId}`);
      const store = response.data;
      
      setFormData({
        storeName: store.storeName || '',
        shopDomain: store.shopDomain || '',
        accessToken: '', // Don't pre-fill for security
        apiKey: store.apiKey || '',
        apiSecret: '', // Don't pre-fill for security
        environment: store.environment || 'production',
        isDefault: store.isDefault || false,
      });
    } catch (error: any) {
      console.error('Error fetching store:', error);
      setError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to load store data'
      );
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Normalize domain
      let domain = formData.shopDomain.trim().toLowerCase();
      if (!domain.endsWith('.myshopify.com')) {
        domain = `${domain}.myshopify.com`;
      }

      // Only include fields that are filled
      const updateData: any = {
        storeName: formData.storeName,
        shopDomain: domain,
        environment: formData.environment,
        isDefault: formData.isDefault,
      };

      // Only include credentials if they're provided (user wants to update them)
      if (formData.accessToken) {
        updateData.accessToken = formData.accessToken;
      }
      if (formData.apiKey) {
        updateData.apiKey = formData.apiKey;
      }
      if (formData.apiSecret) {
        updateData.apiSecret = formData.apiSecret;
      }

      const response = await api.put(`/api/stores/${storeId}`, updateData);

      notify.success('Store updated successfully!');
      router.push('/dashboard/stores');
    } catch (error: any) {
      console.error('Error updating store:', error);
      setError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to update store. Please check your inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading store data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Navigation */}
      <nav className="bg-surface-raised border-b border-border-default shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-500">
              Auto Shopify Store Builder
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard/stores" className="text-text-secondary hover:text-text-primary">
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
            Edit Store Connection
          </h1>
          <p className="text-text-secondary mb-8">
            Update your Shopify store connection details
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Store Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                placeholder="My Awesome Store"
                className="w-full px-4 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-text-muted">
                A friendly name to identify this store
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Shop Domain <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  required
                  value={formData.shopDomain.replace('.myshopify.com', '')}
                  onChange={(e) => setFormData({ ...formData, shopDomain: e.target.value })}
                  placeholder="your-store"
                  className="flex-1 px-4 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <span className="text-text-secondary text-sm">.myshopify.com</span>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                Your Shopify store domain (without https://)
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Leave credential fields empty to keep existing values. Only fill them if you want to update the credentials.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Access Token (leave empty to keep current)
              </label>
              <input
                type="password"
                value={formData.accessToken}
                onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              />
              <p className="mt-1 text-sm text-text-muted">
                Admin API access token from your custom app
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                API Key (leave empty to keep current)
              </label>
              <input
                type="text"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="API Key"
                className="w-full px-4 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                API Secret (leave empty to keep current)
              </label>
              <input
                type="password"
                value={formData.apiSecret}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                placeholder="API Secret"
                className="w-full px-4 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Environment
              </label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value as any })}
                className="w-full px-4 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="production">Production</option>
                <option value="development">Development</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-border-default rounded"
              />
              <label htmlFor="isDefault" className="ml-2 block text-sm text-text-secondary">
                Set as default store
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    Updating...
                  </span>
                ) : (
                  'Update Store'
                )}
              </button>

              <Link
                href="/dashboard/stores"
                className="px-6 py-3 bg-surface-elevated hover:bg-surface-hover text-text-secondary rounded-lg font-medium transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* Security Note */}
          <div className="mt-6 bg-surface-base border border-border-default rounded-lg p-4">
            <p className="text-sm text-text-secondary">
              <strong>Security:</strong> Your credentials are encrypted using AES-256-GCM before storage.
              They are only decrypted when needed to perform operations on your behalf.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

