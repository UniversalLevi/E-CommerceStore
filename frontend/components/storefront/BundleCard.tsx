'use client';

import { useCartStore } from '@/store/useCartStore';
import { notify } from '@/lib/toast';
import { Layers, ShoppingCart } from 'lucide-react';
import ProductImage from '@/components/ProductImage';

interface BundleCardProps {
  bundle: any;
  currency?: string;
}

export default function BundleCard({ bundle, currency = 'INR' }: BundleCardProps) {
  const { addItem } = useCartStore();

  const fmt = (paise: number) => {
    const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
    return `${sym}${(paise / 100).toFixed(0)}`;
  };

  const savings = bundle.originalPrice - bundle.bundlePrice;
  const savingsPercent = Math.round((savings / bundle.originalPrice) * 100);

  const handleAddBundle = () => {
    if (!bundle.products) return;
    for (const item of bundle.products) {
      const prod = item.productId;
      if (typeof prod === 'object' && prod._id) {
        addItem({
          productId: prod._id,
          title: prod.title || 'Bundle item',
          image: prod.images?.[0],
          price: Math.round(bundle.bundlePrice / bundle.products.length),
          variant: item.variantName,
          quantity: item.quantity || 1,
        });
      }
    }
    notify.success('Bundle added to cart');
  };

  return (
    <div className="border rounded-xl p-4 hover:shadow-lg transition-shadow bg-white dark:bg-gray-900 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-5 w-5 text-purple-500" />
        <h3 className="font-semibold text-lg">{bundle.title}</h3>
      </div>

      {bundle.description && <p className="text-sm text-gray-500 mb-3">{bundle.description}</p>}

      <div className="flex gap-2 mb-3 overflow-x-auto">
        {bundle.products?.map((item: any, i: number) => {
          const prod = typeof item.productId === 'object' ? item.productId : null;
          return (
            <div key={i} className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              {prod?.images?.[0] && <ProductImage src={prod.images[0]} alt={prod.title || ''} className="w-full h-full object-cover" />}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-bold">{fmt(bundle.bundlePrice)}</span>
          <span className="text-sm text-gray-400 line-through ml-2">{fmt(bundle.originalPrice)}</span>
          <span className="text-xs text-green-500 ml-2">Save {savingsPercent}%</span>
        </div>
        <button
          onClick={handleAddBundle}
          className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
        >
          <ShoppingCart className="h-4 w-4" />Add
        </button>
      </div>
    </div>
  );
}
