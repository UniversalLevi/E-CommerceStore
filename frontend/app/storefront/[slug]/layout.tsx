'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import CartSidebar from '@/components/storefront/CartSidebar';
import { StoreThemeProvider } from '@/contexts/StoreThemeContext';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';
import { StoreTheme } from '@/themes/base/types';

function StorefrontLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const slug = params.slug as string;
  const [store, setStore] = useState<any>(null);
  const [storeTheme, setStoreTheme] = useState<StoreTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const { setStoreSlug } = useCartStore();
  const { isOpen: cartOpen, closeCart } = useCart();

  useEffect(() => {
    if (slug) {
      setStoreSlug(slug);
      fetchStoreData();
    }
  }, [slug, setStoreSlug]);

  // Refresh theme when store changes (e.g., after theme update)
  useEffect(() => {
    if (store?.settings?.theme) {
      const theme = store.settings.theme;
      if (theme && theme.name) {
        setStoreTheme(theme);
      }
    }
  }, [store]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const storeResponse = await api.getStorefrontInfo(slug);
      if (storeResponse.success && storeResponse.data) {
        setStore(storeResponse.data);
        // Get theme from store settings, default to minimal if not set
        const theme = storeResponse.data.settings?.theme;
        if (theme && theme.name) {
          setStoreTheme(theme);
        } else {
          // Default to minimal theme if no theme is set
          setStoreTheme({
            name: 'minimal',
            customizations: {},
          });
        }
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
      // Set default theme even on error
      setStoreTheme({
        name: 'minimal',
        customizations: {},
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <StoreThemeProvider storeTheme={storeTheme} isLoading={loading}>
      {children}
      <CartSidebar
        isOpen={cartOpen}
        onClose={closeCart}
        storeSlug={slug}
        currency={store?.currency || 'INR'}
      />
    </StoreThemeProvider>
  );
}

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <StorefrontLayoutContent>{children}</StorefrontLayoutContent>
    </CartProvider>
  );
}
