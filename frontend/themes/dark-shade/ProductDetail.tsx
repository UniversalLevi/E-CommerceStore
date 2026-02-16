'use client';

import { getImageUrl } from '@/lib/imageUrl';
import { useState } from 'react';
import { useStoreTheme } from '@/contexts/StoreThemeContext';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { notify } from '@/lib/toast';
import './styles.css';

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
    window.location.href = `https://${storeSlug}.eazyds.com/checkout`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <div className="aspect-square rounded-lg overflow-hidden mb-4" style={{ backgroundColor: colors.secondary }}>
            {product.images && product.images.length > 0 ? (
              <img
                src={getImageUrl(product.images[selectedImage])}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span style={{ color: colors.text + '60' }}>No Image</span>
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === idx ? 'border-opacity-100' : 'border-opacity-40'
                  }`}
                  style={{
                    borderColor: colors.accent,
                  }}
                >
                  <img src={getImageUrl(img)} alt={`${product.title} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.primary }}>
            {product.title}
          </h1>

          <div className="mb-6">
            <p className="text-3xl font-bold" style={{ color: colors.accent }}>
              {formatPrice(getProductPrice())}
            </p>
          </div>

          {product.description && (
            <div className="mb-6 animate-fadeIn">
              <p className="text-base leading-relaxed" style={{ color: colors.text, opacity: 0.9 }}>
                {product.description}
              </p>
            </div>
          )}

          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                Variant
              </label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border transition-all duration-300 hover:border-opacity-100 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'rgba(26, 26, 26, 0.8)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  color: colors.text,
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

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 rounded-lg border transition-all duration-300 hover:scale-110 hover:bg-opacity-80 active:scale-95"
                style={{
                  backgroundColor: 'rgba(26, 26, 26, 0.8)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  color: colors.text,
                }}
              >
                -
              </button>
              <span className="text-lg font-medium px-4 animate-pulse" style={{ color: colors.text }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 rounded-lg border transition-all duration-300 hover:scale-110 hover:bg-opacity-80 active:scale-95"
                style={{
                  backgroundColor: 'rgba(26, 26, 26, 0.8)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  color: colors.text,
                }}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 px-6 py-4 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2 border-2 cursor-pointer relative overflow-hidden group"
              style={{
                borderColor: colors.accent,
                color: colors.accent,
                backgroundColor: 'transparent',
              }}
            >
              <ShoppingCart className="h-5 w-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10">Add to Cart</span>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent}15 0%, ${colors.accent}05 100%)`,
                }}
              ></div>
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 px-6 py-4 rounded-xl font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer relative overflow-hidden group"
              style={{ 
                backgroundColor: colors.accent,
                boxShadow: '0 10px 30px rgba(100, 116, 139, 0.4)',
              }}
            >
              <span className="relative z-10">Buy Now</span>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
                }}
              ></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
