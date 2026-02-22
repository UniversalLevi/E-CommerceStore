'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';
import { notify } from '@/lib/toast';
import { ShoppingCart } from 'lucide-react';
import ProductImage from '@/components/ProductImage';

interface BoughtTogetherProps {
  slug: string;
  productId: string;
  currentProduct: any;
  currency?: string;
}

export default function BoughtTogether({ slug, productId, currentProduct, currency = 'INR' }: BoughtTogetherProps) {
  const [related, setRelated] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const { addItem } = useCartStore();

  useEffect(() => {
    load();
  }, [slug, productId]);

  const load = async () => {
    try {
      const res = await api.getBoughtTogether(slug, productId);
      if (res.success && res.data?.products?.length > 0) {
        setRelated(res.data.products);
        setDiscount(res.data.discount || 0);
      }
    } catch { }
  };

  if (related.length === 0) return null;

  const fmt = (paise: number) => {
    const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
    return `${sym}${(paise / 100).toFixed(0)}`;
  };

  const allProducts = [currentProduct, ...related];
  const totalPrice = allProducts.reduce((sum, p) => sum + (p.basePrice || 0), 0);
  const discountedPrice = Math.round(totalPrice * (1 - discount / 100));

  const handleAddAll = () => {
    for (const p of allProducts) {
      addItem({
        productId: p._id,
        title: p.title,
        image: p.images?.[0],
        price: Math.round(p.basePrice * (1 - discount / 100)),
        quantity: 1,
      });
    }
    notify.success('All items added to cart');
  };

  return (
    <div className="border rounded-xl p-5 mt-8">
      <h3 className="text-lg font-semibold mb-4">Frequently Bought Together</h3>
      <div className="flex items-center gap-3 flex-wrap mb-4">
        {allProducts.map((p, i) => (
          <div key={p._id} className="flex items-center gap-3">
            {i > 0 && <span className="text-2xl text-gray-300">+</span>}
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
              {p.images?.[0] && <ProductImage src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-bold">{fmt(discountedPrice)}</span>
          {discount > 0 && (
            <>
              <span className="text-sm text-gray-400 line-through ml-2">{fmt(totalPrice)}</span>
              <span className="text-xs text-green-500 ml-2">Save {discount}%</span>
            </>
          )}
        </div>
        <button onClick={handleAddAll} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
          <ShoppingCart className="h-4 w-4" />Add All to Cart
        </button>
      </div>
    </div>
  );
}
