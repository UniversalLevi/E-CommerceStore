'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import CartSidebar from '@/components/storefront/CartSidebar';
import { ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const slug = params.slug as string;
  const [store, setStore] = useState<any>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const { items, setStoreSlug, getTotalItems } = useCartStore();

  useEffect(() => {
    if (slug) {
      setStoreSlug(slug);
      // Load store info for currency
      api.getStorefrontInfo(slug).then((res) => {
        if (res.success) {
          setStore(res.data);
        }
      });
    }
  }, [slug, setStoreSlug]);

  return (
    <>
      {children}
      
      {/* Cart Button */}
      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-4 shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all z-30 flex items-center gap-2"
      >
        <ShoppingCart className="h-6 w-6" />
        {getTotalItems() > 0 && (
          <span className="bg-white text-purple-600 rounded-full px-2 py-1 text-sm font-bold min-w-[1.5rem] text-center">
            {getTotalItems()}
          </span>
        )}
      </button>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        storeSlug={slug}
        currency={store?.currency || 'INR'}
      />
    </>
  );
}
