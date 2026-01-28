'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { loadTheme } from '@/themes/themeLoader';

export default function AboutPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { theme, colors } = useStoreTheme();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ThemeComponents, setThemeComponents] = useState<any>(null);

  useEffect(() => {
    const themeName = theme?.name || 'modern';
    loadTheme(themeName)
      .then((components) => {
        setThemeComponents(components);
      })
      .catch((error) => {
        console.error('Error loading theme:', error);
        loadTheme('modern').then((components) => {
          setThemeComponents(components);
        });
      });
  }, [theme]);

  useEffect(() => {
    if (slug) {
      fetchStore();
    }
  }, [slug]);

  const fetchStore = async () => {
    try {
      setLoading(true);
      const storeResponse = await api.getStorefrontInfo(slug);
      if (storeResponse.success) {
        setStore(storeResponse.data);
      }
    } catch (error: any) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !ThemeComponents || !theme) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background || '#ffffff' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.accent || '#4a90d9' }} />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background || '#ffffff' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text || '#1a1a1a' }}>Store Not Found</h1>
        </div>
      </div>
    );
  }

  const { Header, Footer, About } = ThemeComponents;

  if (!Header || !Footer || !About) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors?.background || '#ffffff' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors?.accent || '#4a90d9' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors?.background || '#ffffff' }}>
      <Header
        storeSlug={slug}
        storeName={store.name}
      />
      <main className="flex-1" style={{ maxWidth: 'var(--theme-container-width, 1280px)', margin: '0 auto', width: '100%', padding: '2rem 1rem' }}>
        <About storeSlug={slug} storeName={store.name} />
      </main>
      <Footer storeSlug={slug} storeName={store.name} />
    </div>
  );
}
