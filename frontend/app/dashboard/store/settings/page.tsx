'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Settings, Loader2, ExternalLink, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function StoreSettingsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [razorpayStatus, setRazorpayStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchData();
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const storeResponse = await api.getMyStore();
      if (storeResponse.success && storeResponse.data) {
        setStore(storeResponse.data);
        const statusResponse = await api.getRazorpayStatus(storeResponse.data._id);
        if (statusResponse.success) {
          setRazorpayStatus(statusResponse.data);
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

  const handleConnectRazorpay = async () => {
    try {
      setConnecting(true);
      const response = await api.initiateRazorpayConnect(store._id);
      if (response.success && response.data.onboardingUrl) {
        window.open(response.data.onboardingUrl, '_blank');
        notify.success('Redirecting to Razorpay onboarding...');
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to initiate Razorpay connection');
    } finally {
      setConnecting(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Connected
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-500/20 text-yellow-400">
            <AlertCircle className="h-4 w-4" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400">
            <XCircle className="h-4 w-4" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-500/20 text-gray-400">
            Not Connected
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Store Settings</h1>

      <div className="bg-surface-raised rounded-lg border border-border-default p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Store Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Store Name</label>
              <input
                type="text"
                value={store.name}
                disabled
                className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary opacity-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Store Slug</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={store.slug}
                  disabled
                  className="flex-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary opacity-50 cursor-not-allowed"
                />
                <div className="flex gap-2">
                  <a
                    href={`/storefront/${store.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visit Store (Path)
                  </a>
                  <a
                    href={`https://${store.slug}.eazydropshipping.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visit Store (Subdomain)
                  </a>
                </div>
              </div>
              <p className="mt-1 text-sm text-text-secondary">Slug cannot be changed after creation</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Currency</label>
              <input
                type="text"
                value={store.currency}
                disabled
                className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary opacity-50 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-text-secondary">Currency cannot be changed after creation</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border-default pt-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Payment Account</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary mb-1">Razorpay Account</p>
                <p className="text-sm text-text-secondary">
                  Connect your Razorpay account to accept payments directly
                </p>
              </div>
              {getStatusBadge(razorpayStatus?.accountStatus || 'not_connected')}
            </div>

            {razorpayStatus?.accountStatus !== 'active' && (
              <button
                onClick={handleConnectRazorpay}
                disabled={connecting}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-5 w-5" />
                    Connect Razorpay Account
                  </>
                )}
              </button>
            )}

            {razorpayStatus?.accountStatus === 'active' && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-sm text-green-400">
                  Your Razorpay account is connected. Payments will go directly to your account.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
