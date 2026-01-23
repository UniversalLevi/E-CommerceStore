'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { CheckCircle2, Loader2, Package } from 'lucide-react';
import Link from 'next/link';

export default function OrderConfirmationPage() {
  const params = useParams();
  const slug = params.slug as string;
  const orderId = params.orderId as string;
  const [store, setStore] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug && orderId) {
      fetchData();
    }
  }, [slug, orderId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const storeResponse = await api.getStorefrontInfo(slug);
      if (storeResponse.success) {
        setStore(storeResponse.data);
      }
      // Note: We'd need a public order endpoint to fetch order details
      // For now, we'll just show confirmation
    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-surface-raised rounded-lg border border-border-default p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Order Confirmed!</h1>
          <p className="text-text-secondary mb-4">
            Your order <span className="font-semibold text-text-primary">{orderId}</span> has been placed successfully.
          </p>
          <p className="text-sm text-text-secondary mb-6">
            You will receive an email confirmation shortly with order details.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href={`/storefront/${slug}`}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
