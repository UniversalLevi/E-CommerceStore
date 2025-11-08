'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';

export default function ConnectStorePage() {
  const router = useRouter();
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
  const [error, setError] = useState('');

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

      const response = await api.post<{ success: boolean; data: any; shopInfo?: any }>('/api/stores', {
        ...formData,
        shopDomain: domain,
      });

      notify.success(`Store connected successfully! ${response.data?.shopInfo?.name || ''}`);
      router.push('/dashboard/stores');
    } catch (error: any) {
      console.error('Error connecting store:', error);
      setError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Failed to connect store. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
              Auto Shopify Store Builder
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard/stores" className="text-gray-600 hover:text-gray-900">
                ← Back to Stores
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connect Your Shopify Store
          </h1>
          <p className="text-gray-600 mb-8">
            Enter your custom Shopify app credentials to connect your store
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-3">
              📚 How to get your credentials:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
              <li>
                Go to your Shopify admin → Settings → Apps and sales channels → Develop apps
              </li>
              <li>Click "Create an app" and give it a name</li>
              <li>
                Configure Admin API scopes: <code className="bg-blue-100 px-1 py-0.5 rounded">
                  write_products, read_products, write_themes, read_themes
                </code>
              </li>
              <li>Click "Install app" to generate credentials</li>
              <li>Copy the "Admin API access token" (you'll only see it once!)</li>
              <li>Paste it below along with your store domain</li>
            </ol>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                placeholder="My Awesome Store"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                A friendly name to identify this store
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Domain <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  required
                  value={formData.shopDomain}
                  onChange={(e) => setFormData({ ...formData, shopDomain: e.target.value })}
                  placeholder="your-store"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <span className="text-gray-600 text-sm">.myshopify.com</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Your Shopify store domain (without https://)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.accessToken}
                onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                Admin API access token from your custom app
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key (optional)
              </label>
              <input
                type="text"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="API Key"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Secret (optional)
              </label>
              <input
                type="password"
                value={formData.apiSecret}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                placeholder="API Secret"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment
              </label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
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
                    Validating & Connecting...
                  </span>
                ) : (
                  'Connect Store'
                )}
              </button>

              <Link
                href="/dashboard/stores"
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* Security Note */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              🔒 <strong>Security:</strong> Your credentials are encrypted using AES-256-GCM before storage.
              They are only decrypted when needed to perform operations on your behalf.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



