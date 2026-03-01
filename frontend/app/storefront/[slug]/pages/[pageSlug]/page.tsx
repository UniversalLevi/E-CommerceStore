'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { useCart } from '@/contexts/CartContext';
import { loadTheme } from '@/themes/themeLoader';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StorefrontCustomPage() {
  const params = useParams();
  const slug = params.slug as string;
  const pageSlug = params.pageSlug as string;
  const [store, setStore] = useState<any>(null);
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ThemeComponents, setThemeComponents] = useState<any>(null);
  const { theme, colors } = useStoreTheme();
  const { openCart } = useCart();

  useEffect(() => {
    if (slug && pageSlug) fetchData();
  }, [slug, pageSlug]);

  useEffect(() => {
    const themeName = theme?.name || 'modern';
    loadTheme(themeName).then((components) => setThemeComponents(components)).catch(() => loadTheme('modern').then(setThemeComponents));
  }, [theme]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [storeRes, pageRes] = await Promise.all([
        api.getStorefrontInfo(slug),
        api.getStorefrontPage(slug, pageSlug),
      ]);
      if (storeRes.success && storeRes.data) setStore(storeRes.data);
      if (pageRes.success && pageRes.data) setPage(pageRes.data);
      if (!pageRes.success || !pageRes.data) setError('Page not found');
    } catch {
      setError('Page not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !ThemeComponents || !theme) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors?.background || '#fff' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors?.accent }} />
      </div>
    );
  }

  if (error || !page || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors?.background || '#fff' }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: colors?.text }}>Page not found</p>
          <Link href={`/storefront/${slug}`} className="underline" style={{ color: colors?.accent }}>Back to store</Link>
        </div>
      </div>
    );
  }

  const { Header, Footer } = ThemeComponents;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors?.background }}>
      <Header storeSlug={slug} storeName={store.name} onCartClick={openCart} />
      <main className="flex-1" style={{ maxWidth: 'var(--theme-container-width, 1280px)', margin: '0 auto', width: '100%', padding: '2rem 1rem' }}>
        <Link
          href={`/storefront/${slug}`}
          className="inline-flex items-center gap-2 mb-6 hover:opacity-80"
          style={{ color: colors?.text + 'CC' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to store
        </Link>
        <h1 className="text-3xl font-bold mb-6" style={{ color: colors?.text }}>{page.title}</h1>
        <div
          className="prose max-w-none"
          style={{ color: colors?.text }}
          dangerouslySetInnerHTML={{ __html: page.body || '' }}
        />
      </main>
      <Footer storeSlug={slug} storeName={store.name} />
    </div>
  );
}
