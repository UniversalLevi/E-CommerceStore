'use client';

import Link from 'next/link';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { HomeSectionConfig } from '@/themes/base/types';
import { loadTheme } from '@/themes/themeLoader';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Package } from 'lucide-react';

interface HomeSectionRendererProps {
  section: HomeSectionConfig;
  storeSlug: string;
  storeName: string;
  themeName: string;
  currency: string;
}

export default function HomeSectionRenderer({
  section,
  storeSlug,
  storeName,
  themeName,
  currency,
}: HomeSectionRendererProps) {
  const { colors } = useStoreTheme();

  if (section.type === 'hero') {
    const imageUrl = (section.props.imageUrl as string) || '';
    const heading = (section.props.heading as string) || `Welcome to ${storeName}`;
    const subheading = (section.props.subheading as string) || '';
    const ctaText = (section.props.ctaText as string) || 'Shop Now';
    const ctaLink = (section.props.ctaLink as string) || `/storefront/${storeSlug}`;
    return (
      <section
        className="relative overflow-hidden py-16 md:py-24"
        style={{ backgroundColor: colors.background }}
      >
        {imageUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0" style={{ backgroundColor: colors.background, opacity: 0.7 }} />
          </div>
        )}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: colors.primary }}>
            {heading}
          </h2>
          {subheading && (
            <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: colors.text }}>
              {subheading}
            </p>
          )}
          <Link
            href={ctaLink.startsWith('/') ? ctaLink : `/${ctaLink}`}
            className="inline-block px-6 py-3 rounded-lg font-semibold text-white"
            style={{ backgroundColor: colors.accent }}
          >
            {ctaText}
          </Link>
        </div>
      </section>
    );
  }

  if (section.type === 'text') {
    const heading = (section.props.heading as string) || '';
    const body = (section.props.body as string) || '';
    return (
      <section className="py-12 md:py-16" style={{ backgroundColor: colors.secondary }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {heading && (
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: colors.primary }}>
              {heading}
            </h2>
          )}
          {body && (
            <div
              className="prose max-w-none"
              style={{ color: colors.text }}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          )}
        </div>
      </section>
    );
  }

  if (section.type === 'custom_html') {
    const html = (section.props.html as string) || '';
    return (
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </section>
    );
  }

  if (section.type === 'featured_products') {
    return (
      <FeaturedProductsSection
        storeSlug={storeSlug}
        currency={currency}
        title={(section.props.title as string) || 'Featured Products'}
        limit={Number(section.props.limit) || 8}
        themeName={themeName}
      />
    );
  }

  return null;
}

function FeaturedProductsSection({
  storeSlug,
  currency,
  title,
  limit,
  themeName,
}: {
  storeSlug: string;
  currency: string;
  title: string;
  limit: number;
  themeName: string;
}) {
  const { colors } = useStoreTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [ThemeProductCard, setThemeProductCard] = useState<any>(null);

  useEffect(() => {
    loadTheme(themeName).then((c) => setThemeProductCard(c?.ProductCard || null)).catch(() => setThemeProductCard(null));
  }, [themeName]);

  useEffect(() => {
    api
      .getStorefrontProducts(storeSlug, { sort: 'newest', limit })
      .then((r) => {
        if (r.success && r.data?.products) setProducts(r.data.products.slice(0, limit));
      })
      .catch(() => setProducts([]));
  }, [storeSlug, limit]);

  const validProducts = products.filter((p): p is NonNullable<typeof p> => p != null && p._id);
  if (validProducts.length === 0) return null;

  return (
    <section className="py-12 md:py-16" style={{ backgroundColor: colors.background }}>
      <div style={{ maxWidth: 'var(--theme-container-width, 1280px)', margin: '0 auto', width: '100%', padding: '0 1rem' }}>
        <h2 className="text-2xl font-bold mb-8" style={{ color: colors.primary }}>
          {title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {validProducts.map((product) =>
            ThemeProductCard ? (
              <ThemeProductCard
                key={product._id}
                product={product}
                storeSlug={storeSlug}
                currency={currency}
              />
            ) : (
              <ProductCardFallback key={product._id} product={product} storeSlug={storeSlug} currency={currency} colors={colors} />
            )
          )}
        </div>
      </div>
    </section>
  );
}

function ProductCardFallback({
  product,
  storeSlug,
  currency,
  colors,
}: {
  product: any;
  storeSlug: string;
  currency: string;
  colors: Record<string, string>;
}) {
  const price = product.variants?.[0]?.price ?? product.price ?? 0;
  const displayPrice = (price / 100).toLocaleString('en-IN', { style: 'currency', currency });
  return (
    <Link
      href={`/storefront/${storeSlug}/products/${product._id}`}
      className="block rounded-lg border overflow-hidden transition hover:shadow-lg"
      style={{ borderColor: colors.primary + '30', backgroundColor: colors.secondary }}
    >
      {product.images?.[0]?.url ? (
        <img src={product.images[0].url} alt={product.name} className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square flex items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
          <Package className="h-12 w-12" style={{ color: colors.text, opacity: 0.5 }} />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold truncate" style={{ color: colors.text }}>{product.name}</h3>
        <p className="text-sm font-medium mt-1" style={{ color: colors.primary }}>{displayPrice}</p>
      </div>
    </Link>
  );
}
