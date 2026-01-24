'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';
import { notify } from '@/lib/toast';
import { Loader2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

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

  const handleAddToCart = () => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!product || !store) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Product Not Found</h1>
          <Link href={`/storefront/${slug}`} className="text-purple-500 hover:text-purple-400">
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href={`/storefront/${slug}`} className="text-text-secondary hover:text-text-primary mb-6 inline-block">
          ← Back to Store
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div>
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full rounded-lg"
              />
            ) : (
              <div className="w-full h-96 bg-surface-raised rounded-lg flex items-center justify-center">
                <span className="text-text-secondary">No image</span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-4">{product.title}</h1>
            <p className="text-3xl font-bold text-purple-500 mb-6">
              {formatPrice(getProductPrice(), store.currency)}
            </p>

            {product.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-text-primary mb-2">Description</h2>
                <p className="text-text-secondary whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {product.variantDimension && product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {product.variantDimension}
                </label>
                <select
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  className="w-full px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary"
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

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-24 px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                className="flex-1 px-6 py-3 bg-surface-raised border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition-all font-medium flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </button>
              <button
                onClick={() => {
                  handleAddToCart();
                  setTimeout(() => router.push(`/storefront/${slug}/checkout`), 100);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
