'use client';

import { getImageUrl } from '@/lib/imageUrl';
import { useState } from 'react';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { notify } from '@/lib/toast';
import '../minimalist/styles.css';

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
  const { colors } = useStoreTheme();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 minimalist-fade">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <div className="aspect-square overflow-hidden mb-6 bg-gray-50" style={{ border: `1px solid ${colors.border || colors.primary + '10'}` }}>
            {product.images && product.images.length > 0 ? (
              <img
                src={getImageUrl(product.images[selectedImage])}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.secondary }}>
                <span className="text-xs" style={{ color: colors.text + '40' }}>No Image</span>
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square overflow-hidden minimalist-hover ${
                    selectedImage === idx ? 'border' : 'border border-transparent'
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
          <h1 className="text-3xl md:text-4xl font-medium mb-6 minimalist-fade" style={{ color: colors.primary }}>
            {product.title}
          </h1>

          <div className="mb-8">
            <p className="text-2xl font-medium" style={{ color: colors.accent }}>
              {formatPrice(getProductPrice())}
            </p>
          </div>

          {product.description && (
            <div className="mb-8">
              <p className="text-sm leading-relaxed" style={{ color: colors.text + '80' }}>
                {product.description}
              </p>
            </div>
          )}

          {product.variants && product.variants.length > 0 && (
            <div className="mb-8">
              <label className="block text-xs font-medium mb-2" style={{ color: colors.text }}>
                Variant
              </label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="w-full px-4 py-2 border minimalist-input"
                style={{
                  borderColor: colors.border || colors.primary + '20',
                  color: colors.text,
                  backgroundColor: 'transparent',
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
            <label className="block text-xs font-medium mb-2" style={{ color: colors.text }}>
              Quantity
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 border minimalist-button"
                style={{
                  borderColor: colors.border || colors.primary + '20',
                  color: colors.primary,
                }}
              >
                -
              </button>
              <span className="text-base font-medium" style={{ color: colors.text }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 border minimalist-button"
                style={{
                  borderColor: colors.border || colors.primary + '20',
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
              className="flex-1 px-6 py-3 minimalist-button flex items-center justify-center gap-2 border cursor-pointer"
              style={{
                borderColor: colors.accent,
                color: colors.accent,
                backgroundColor: 'transparent',
              }}
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 px-6 py-3 minimalist-button cursor-pointer text-white"
              style={{ 
                backgroundColor: colors.accent,
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
