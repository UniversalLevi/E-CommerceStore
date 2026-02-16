'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { getImageUrl } from '@/lib/imageUrl';
import { X, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  currency?: string;
}

export default function CartSidebar({ isOpen, onClose, storeSlug, currency = 'INR' }: CartSidebarProps) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems, clearCart } = useCartStore();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

  const handleCheckout = () => {
    onClose();
    router.push(`/storefront/${storeSlug}/checkout`);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-surface-raised border-l border-border-default z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-text-primary">Shopping Cart</h2>
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
              {getTotalItems()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="h-16 w-16 text-text-secondary mb-4" />
              <p className="text-text-secondary">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={`${item.productId}-${item.variant || 'none'}-${index}`}
                  className="bg-surface-base rounded-lg p-4 border border-border-default"
                >
                  <div className="flex gap-4">
                    {item.image && (
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.title || 'Product'}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-text-primary mb-1">{item.title || 'Product'}</h3>
                      {item.variant && (
                        <p className="text-sm text-text-secondary mb-2">Variant: {item.variant}</p>
                      )}
                      {item.price && (
                        <p className="text-sm font-semibold text-purple-500 mb-2">
                          {formatPrice(item.price)}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variant, item.quantity - 1)}
                          className="p-1 hover:bg-surface-hover rounded transition-colors"
                        >
                          <Minus className="h-4 w-4 text-text-secondary" />
                        </button>
                        <span className="px-3 py-1 bg-surface-raised rounded text-text-primary min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variant, item.quantity + 1)}
                          className="p-1 hover:bg-surface-hover rounded transition-colors"
                        >
                          <Plus className="h-4 w-4 text-text-secondary" />
                        </button>
                        <button
                          onClick={() => removeItem(item.productId, item.variant)}
                          className="ml-auto p-1 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border-default p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-text-primary">Total</span>
              <span className="text-xl font-bold text-purple-500">
                {formatPrice(getTotalPrice())}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={() => {
                clearCart();
                onClose();
              }}
              className="w-full px-4 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition-colors text-sm"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
