'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import SubscriptionLock from '@/components/SubscriptionLock';
import { useStoreSubscription } from '@/hooks/useStoreSubscription';

export default function CreateStorePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { hasActiveStoreSubscription, loading: subscriptionLoading } = useStoreSubscription();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    currency: 'INR',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      const response = await api.createStore(formData);
      if (response.success) {
        notify.success('Store created successfully!');
        router.push('/dashboard/store/overview');
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: formData.slug || generateSlug(name),
    });
  };

  // Check store subscription before rendering
  if (!authLoading && !subscriptionLoading && isAuthenticated && !hasActiveStoreSubscription) {
    return <SubscriptionLock featureName="Create Store" planType="stores" />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard/store"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Store
      </Link>

      <div className="bg-surface-raised rounded-lg border border-border-default p-6">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Create Your Store</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Store Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={handleNameChange}
              className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="My Awesome Store"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Store Slug *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="my-awesome-store"
            />
            <p className="mt-1 text-sm text-text-secondary">
              Your store will be accessible at: {formData.slug ? `${formData.slug}.eazyds.com` : 'your-slug.eazyds.com'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Currency *
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
            <p className="mt-1 text-sm text-text-secondary">
              Currency cannot be changed after creation
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Store'
              )}
            </button>
            <Link
              href="/dashboard/store"
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
