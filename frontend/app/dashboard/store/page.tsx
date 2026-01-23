'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Store, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function StoreDashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchStore();
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchStore = async () => {
    try {
      setLoading(true);
      const response = await api.getMyStore();
      if (response.success && response.data) {
        setStore(response.data);
        // Redirect to overview if store exists
        router.push(`/dashboard/store/overview`);
      }
    } catch (error: any) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Show create store CTA if no store exists
  if (!store) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-surface-raised rounded-lg border border-border-default p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <Store className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Create Your Store</h1>
          <p className="text-text-secondary mb-6">
            Start selling online with your own independent store. Create products, accept payments, and manage orders all in one place.
          </p>
          <Link
            href="/dashboard/store/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
          >
            <Plus className="h-5 w-5" />
            Create Store
          </Link>
        </div>
      </div>
    );
  }

  return null; // Will redirect to overview
}
