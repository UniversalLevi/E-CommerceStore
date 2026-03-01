'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import CartSidebar from '@/components/storefront/CartSidebar';
import AnnouncementBar from '@/components/storefront/AnnouncementBar';
import EmailPopup from '@/components/storefront/EmailPopup';
import AIChatWidget from '@/components/storefront/AIChatWidget';
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
  const [pluginConfigs, setPluginConfigs] = useState<Record<string, any>>({});
  const [customPages, setCustomPages] = useState<{ slug: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { setStoreSlug } = useCartStore();
  const { isOpen: cartOpen, closeCart } = useCart();

  useEffect(() => {
    if (slug) {
      setStoreSlug(slug);
      fetchStoreData();
    }
  }, [slug, setStoreSlug]);

  useEffect(() => {
    if (store?.settings?.theme) {
      const theme = store.settings.theme;
      if (theme && theme.name) {
        setStoreTheme(theme);
      }
    }
  }, [store]);

  useEffect(() => {
    if (!slug || !pluginConfigs['page-builder'] || pluginConfigs['page-builder'].enabled === false) {
      setCustomPages([]);
      return;
    }
    api.getStorefrontPages(slug)
      .then((r) => {
        if (r.success && Array.isArray(r.data)) setCustomPages(r.data);
        else setCustomPages([]);
      })
      .catch(() => setCustomPages([]));
  }, [slug, pluginConfigs['page-builder']]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const [storeResponse, pluginsResponse] = await Promise.all([
        api.getStorefrontInfo(slug),
        api.getStorefrontPlugins(slug).catch(() => ({ success: false, data: {} })),
      ]);
      if (storeResponse.success && storeResponse.data) {
        setStore(storeResponse.data);
        const theme = storeResponse.data.settings?.theme;
        if (theme && theme.name) {
          setStoreTheme(theme);
        } else {
          setStoreTheme({ name: 'modern', customizations: {} });
        }
      }
      if (pluginsResponse.success && pluginsResponse.data) {
        setPluginConfigs(pluginsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
      setStoreTheme({ name: 'modern', customizations: {} });
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

  const announcementConfig = pluginConfigs['announcement-bar'];
  const popupConfig = pluginConfigs['email-popup'];
  const chatConfig = pluginConfigs['ai-chatbot'];

  const homeSections = Array.isArray(pluginConfigs['page-builder']?.homeSections) ? pluginConfigs['page-builder'].homeSections : [];

  return (
    <StoreThemeProvider storeTheme={storeTheme} isLoading={loading} customPages={customPages} homeSections={homeSections}>
      {announcementConfig?.announcements?.length > 0 && (
        <AnnouncementBar announcements={announcementConfig.announcements} speed={announcementConfig.speed} />
      )}
      {children}
      <CartSidebar
        isOpen={cartOpen}
        onClose={closeCart}
        storeSlug={slug}
        currency={store?.currency || 'INR'}
      />
      {popupConfig && <EmailPopup slug={slug} config={popupConfig} />}
      {chatConfig && chatConfig.enabled !== false && <AIChatWidget slug={slug} config={chatConfig} />}
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
