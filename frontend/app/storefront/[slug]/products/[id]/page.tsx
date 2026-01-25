'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';
import { notify } from '@/lib/toast';
import { Loader2, ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { useCart } from '@/contexts/CartContext';
import { loadTheme } from '@/themes/themeLoader';

export default function StorefrontProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const productId = params.id as string;
  const [store, setStore] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const { theme, colors } = useStoreTheme();
  const { openCart } = useCart();
  const [ThemeComponents, setThemeComponents] = useState<any>(null);

  // Load theme components
  useEffect(() => {
    const themeName = theme?.name || 'minimal';
    loadTheme(themeName).then((components) => {
      setThemeComponents(components);
    });
  }, [theme]);

  useEffect(() => {
    if (slug && productId) {
      fetchData();
    }
  }, [slug, productId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [storeResponse, productResponse] = await Promise.all([
        api.getStorefrontInfo(slug),
        api.getStorefrontProduct(slug, productId),
      ]);

      if (storeResponse.success) {
        setStore(storeResponse.data);
      }

      if (productResponse.success) {
        setProduct(productResponse.data);
        if (productResponse.data.variants && productResponse.data.variants.length > 0) {
          setSelectedVariant(productResponse.data.variants[0].name);
        }
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const { addItem } = useCartStore();

  const handleAddToCart = (openCartAfter = false) => {
    const cartItem = {
      productId: product._id,
      title: product.title,
      image: product.images && product.images.length > 0 ? product.images[0] : undefined,
      price: getProductPrice(),
      variant: selectedVariant || undefined,
      quantity,
    };
    addItem(cartItem);
    notify.success('Added to cart');
    // Only open cart if explicitly requested
    if (openCartAfter) {
      setTimeout(() => openCart(), 300);
    }
  };

  const handleBuyNow = () => {
    const cartItem = {
      productId: product._id,
      title: product.title,
      image: product.images && product.images.length > 0 ? product.images[0] : undefined,
      price: getProductPrice(),
      variant: selectedVariant || undefined,
      quantity,
    };
    addItem(cartItem);
    // Navigate directly to checkout without opening cart
    router.push(`/storefront/${slug}/checkout`);
  };

  const formatPrice = (price: number, currency: string = 'INR') => {
    const currencySymbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${(price / 100).toFixed(2)}`;
  };

  const getProductPrice = () => {
    if (selectedVariant && product.variants) {
      const variant = product.variants.find((v: any) => v.name === selectedVariant);
      if (variant && variant.price) {
        return variant.price;
      }
    }
    return product.basePrice;
  };

  if (loading || !ThemeComponents) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.accent }} />
      </div>
    );
  }

  if (!product || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>Product Not Found</h1>
          <Link href={`/storefront/${slug}`} style={{ color: colors.accent }}>
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  const { Header, Footer } = ThemeComponents;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors.background }}>
      <Header
        storeSlug={slug}
        storeName={store.name}
        onCartClick={openCart}
      />
      <div className="flex-1" style={{ maxWidth: 'var(--theme-container-width, 1280px)', margin: '0 auto', width: '100%', padding: '2rem 1rem' }}>
        <Link
          href={`/storefront/${slug}`}
          className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
          style={{ color: colors.text + 'CC' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full rounded-xl"
                style={{ border: `2px solid ${colors.primary}20` }}
              />
            ) : (
              <div
                className="w-full h-96 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: colors.secondary, border: `2px solid ${colors.primary}20` }}
              >
                <span style={{ color: colors.text + '80' }}>No image</span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <h1 className="text-4xl font-bold mb-4" style={{ color: colors.text }}>{product.title}</h1>
            <p className="text-4xl font-bold mb-8" style={{ color: colors.accent }}>
              {formatPrice(getProductPrice(), store.currency)}
            </p>

            {product.description && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>Description</h2>
                <p className="leading-relaxed whitespace-pre-wrap" style={{ color: colors.text + 'CC' }}>{product.description}</p>
              </div>
            )}

            {product.variantDimension && product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: colors.text }}>
                  {product.variantDimension}
                </label>
                <select
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border"
                  style={{
                    backgroundColor: colors.secondary,
                    borderColor: colors.primary + '30',
                    color: colors.text,
                  }}
                >
                  {product.variants.map((variant: any) => (
                    <option key={variant.name} value={variant.name}>
                      {variant.name}
                      {variant.price && variant.price !== product.basePrice
                        ? ` (+${formatPrice(variant.price - product.basePrice, store.currency)})`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-medium mb-3" style={{ color: colors.text }}>Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-24 px-4 py-3 rounded-lg border"
                style={{
                  backgroundColor: colors.secondary,
                  borderColor: colors.primary + '30',
                  color: colors.text,
                }}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleAddToCart(true)}
                className="flex-1 px-6 py-4 rounded-lg font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2 border-2 cursor-pointer"
                style={{
                  borderColor: colors.accent,
                  color: colors.accent,
                  backgroundColor: 'transparent',
                }}
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 px-6 py-4 rounded-lg font-medium text-white transition-all hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: colors.accent }}
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer storeSlug={slug} storeName={store.name} />
    </div>
  );
}
