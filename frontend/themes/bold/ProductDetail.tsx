'use client';

import { getImageUrl } from '@/lib/imageUrl';
import { useState } from 'react';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { notify } from '@/lib/toast';
import '../bold/styles.css';

interface ProductDetailProps {
  product: {
    _id: string;
    title: string;
    description?: string;
    basePrice: number;
    images?: string[];
    variants?: Array<{ name: string; price?: number; inventory?: number }>;
  };
  storeSlug: string;
  currency: string;
}

export default function ProductDetail({ product, storeSlug, currency }: ProductDetailProps) {
  const { colors, typography } = useStoreTheme();
  const { addItem } = useCartStore();
  const { openCart } = useCart();
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState<string>(product.variants?.[0]?.name || '');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const formatPrice = (price: number) => {
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
      const variant = product.variants.find((v) => v.name === selectedVariant);
      if (variant && variant.price) {
        return variant.price;
      }
    }
    return product.basePrice;
  };

  const handleAddToCart = () => {
    const cartItem = {
      productId: product._id,
      title: product.title,
      image: product.images?.[0],
      price: getProductPrice(),
      variant: selectedVariant || undefined,
      quantity,
    };
    addItem(cartItem);
    notify.success('Added to cart');
    setTimeout(() => openCart(), 300);
  };

  const handleBuyNow = () => {
    const cartItem = {
      productId: product._id,
      title: product.title,
      image: product.images?.[0],
      price: getProductPrice(),
      variant: selectedVariant || undefined,
      quantity,
    };
    addItem(cartItem);
    router.push(`/storefront/${storeSlug}/checkout`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 slide-in-bold">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <div className="aspect-square rounded-lg overflow-hidden mb-6 bg-gray-100 border-4" style={{ borderColor: colors.primary }}>
            {product.images && product.images.length > 0 ? (
              <img
                src={getImageUrl(product.images[selectedImage])}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.secondary }}>
                <span className="font-bold" style={{ color: colors.text + '60' }}>No Image</span>
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-4 transition-all bold-hover ${
                    selectedImage === idx ? 'border-primary' : 'border-transparent'
                  }`}
                  style={{ 
                    borderColor: selectedImage === idx ? colors.primary : 'transparent',
                  }}
                >
                  <img src={getImageUrl(img)} alt={`${product.title} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 slide-in-bold" style={{ 
            color: colors.primary,
            fontFamily: typography.headingFont,
          }}>
            {product.title}
          </h1>

          <div className="mb-8">
            <p className="text-4xl font-black" style={{ color: colors.accent }}>
              {formatPrice(getProductPrice())}
            </p>
          </div>

          {product.description && (
            <div className="mb-8">
              <p className="text-lg leading-relaxed font-semibold" style={{ color: colors.text + 'DD' }}>
                {product.description}
              </p>
            </div>
          )}

          {product.variants && product.variants.length > 0 && (
            <div className="mb-8">
              <label className="block text-sm font-bold mb-3 uppercase" style={{ color: colors.text }}>
                Variant
              </label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 bold-input font-bold"
                style={{
                  borderColor: colors.primary,
                  color: colors.text,
                  backgroundColor: colors.secondary,
                }}
              >
                {product.variants.map((variant) => (
                  <option key={variant.name} value={variant.name}>
                    {variant.name} {variant.price ? `- ${formatPrice(variant.price)}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-8">
            <label className="block text-sm font-bold mb-3 uppercase" style={{ color: colors.text }}>
              Quantity
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-5 py-2 rounded-lg border-2 bold-button font-bold"
                style={{
                  borderColor: colors.primary,
                  color: colors.primary,
                }}
              >
                -
              </button>
              <span className="text-xl font-black" style={{ color: colors.text }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-5 py-2 rounded-lg border-2 bold-button font-bold"
                style={{
                  borderColor: colors.primary,
                  color: colors.primary,
                }}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 px-8 py-4 rounded-lg font-bold transition-all bold-button flex items-center justify-center gap-2 border-2 cursor-pointer"
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
              className="flex-1 px-8 py-4 rounded-lg font-black text-white transition-all bold-button cursor-pointer"
              style={{ 
                backgroundColor: colors.primary,
                boxShadow: `0 10px 30px ${colors.primary}50`,
              }}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
