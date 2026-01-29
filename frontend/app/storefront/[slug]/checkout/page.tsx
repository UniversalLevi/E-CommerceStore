'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { notify } from '@/lib/toast';
import { useCartStore } from '@/store/useCartStore';
import { Loader2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { items: cart, setStoreSlug, clearCart } = useCartStore();
  const [formData, setFormData] = useState({
    customer: {
      name: '',
      email: '',
      phone: '',
    },
    shippingAddress: {
      name: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: 'India',
      phone: '',
    },
    shipping: 0,
    paymentMethod: 'razorpay' as 'razorpay' | 'cod',
  });

  useEffect(() => {
    if (slug) {
      setStoreSlug(slug);
      fetchStore();
    }
  }, [slug, setStoreSlug]);

  const fetchStore = async () => {
    try {
      const response = await api.getStorefrontInfo(slug);
      if (response.success) {
        setStore(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || cart.length === 0) return;

    try {
      setProcessing(true);

      // Prepare cart items - ensure they match the expected schema
      const orderItems = cart
        .map((item) => {
          const orderItem: any = {
            productId: item.productId,
            quantity: item.quantity || 1,
          };
          // Only include variant if it's a non-empty string
          if (item.variant && item.variant.trim()) {
            orderItem.variant = item.variant.trim();
          }
          return orderItem;
        })
        .filter((item) => item.productId); // Remove items without productId

      if (orderItems.length === 0) {
        throw new Error('No valid items in cart');
      }

      // Create order
      const orderResponse = await api.createStorefrontOrder(slug, {
        customer: formData.customer,
        shippingAddress: formData.shippingAddress,
        items: orderItems,
        shipping: formData.shipping,
        paymentMethod: formData.paymentMethod,
      });

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error('Failed to create order');
      }

      const order = orderResponse.data;

      // For COD orders, skip payment flow and redirect to order confirmation
      if (formData.paymentMethod === 'cod') {
        clearCart();
        notify.success('Order placed successfully! Payment will be collected on delivery.');
        router.push(`/storefront/${slug}/order/${order.orderId}`);
        return;
      }

      // For Razorpay orders, create payment order
      const paymentResponse = await api.createPaymentOrder(slug, order._id);
      if (!paymentResponse.success || !paymentResponse.data) {
        throw new Error('Failed to create payment order');
      }

      const { razorpayOrderId, amount, currency, keyId, testMode } = paymentResponse.data;

      // Test mode: Auto-approve payment
      if (testMode) {
        // Verify payment immediately (will be auto-approved in test mode)
        const verifyResponse = await api.verifyPayment(slug, order._id, {
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: `test_payment_${Date.now()}`,
          razorpay_signature: 'test_signature',
        });

        if (verifyResponse.success) {
          localStorage.removeItem(`storefront_cart_${slug}`);
          notify.success('Test payment successful! (Test Mode)');
          router.push(`/storefront/${slug}/order/${order.orderId}`);
        } else {
          notify.error('Test payment verification failed');
        }
        return;
      }

      // Production mode: Open Razorpay checkout
      await openRazorpayCheckout(
        {
          key: keyId,
          amount: amount,
          currency: currency,
          order_id: razorpayOrderId,
          name: store.name,
          description: `Order ${order.orderId}`,
        },
        async (response: any) => {
          // Verify payment
          const verifyResponse = await api.verifyPayment(slug, order._id, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verifyResponse.success) {
            clearCart();
            notify.success('Payment successful!');
            router.push(`/storefront/${slug}/order/${order.orderId}`);
          } else {
            notify.error('Payment verification failed');
          }
        },
        (error: any) => {
          notify.error('Payment cancelled or failed');
          console.error('Payment error:', error);
        }
      );
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Checkout failed');
      console.error('Checkout error:', error);
    } finally {
      setProcessing(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 text-text-secondary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Your cart is empty</h1>
          <Link href={`/storefront/${slug}`} className="text-purple-500 hover:text-purple-400">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Customer Information</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={formData.customer.name}
                  onChange={(e) => setFormData({ ...formData, customer: { ...formData.customer, name: e.target.value } })}
                  className="w-full px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary"
                />
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={formData.customer.email}
                  onChange={(e) => setFormData({ ...formData, customer: { ...formData.customer, email: e.target.value } })}
                  className="w-full px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary"
                />
                <input
                  type="tel"
                  required
                  placeholder="Phone"
                  value={formData.customer.phone}
                  onChange={(e) => setFormData({ ...formData, customer: { ...formData.customer, phone: e.target.value } })}
                  className="w-full px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary"
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Shipping Address</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={formData.shippingAddress.name}
                  onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, name: e.target.value } })}
                  className="w-full px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary"
                />
                <input
                  type="text"
                  required
                  placeholder="Address Line 1"
                  value={formData.shippingAddress.address1}
                  onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, address1: e.target.value } })}
                  className="w-full px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary"
                />
                <input
                  type="text"
                  placeholder="Address Line 2"
                  value={formData.shippingAddress.address2}
                  onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, address2: e.target.value } })}
                  className="w-full px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={formData.shippingAddress.city}
                    onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, city: e.target.value } })}
                    className="w-full px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary"
                  />
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={formData.shippingAddress.state}
                    onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, state: e.target.value } })}
                    className="w-full px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="ZIP Code"
                    value={formData.shippingAddress.zip}
                    onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, zip: e.target.value } })}
                    className="w-full px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Country"
                    value={formData.shippingAddress.country}
                    onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, country: e.target.value } })}
                    className="w-full px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary"
                  />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="Phone"
                  value={formData.shippingAddress.phone}
                  onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, phone: e.target.value } })}
                  className="w-full px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-text-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="bg-surface-raised rounded-lg border border-border-default p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between items-start text-sm">
                    <div className="flex-1">
                      <p className="text-text-primary font-medium">{item.title || 'Product'}</p>
                      {item.variant && (
                        <p className="text-text-secondary text-xs">Variant: {item.variant}</p>
                      )}
                      <p className="text-text-secondary text-xs">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-text-primary font-medium ml-4">
                      {formatPrice((item.price || 0) * (item.quantity || 1), store?.currency || 'INR')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border-default pt-4 space-y-2">
                <div className="flex justify-between text-text-primary">
                  <span>Subtotal</span>
                  <span>{formatPrice(cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0), store?.currency || 'INR')}</span>
                </div>
                <div className="flex justify-between text-text-primary">
                  <span>Shipping</span>
                  <span>{formatPrice(formData.shipping, store?.currency || 'INR')}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-text-primary pt-2 border-t border-border-default">
                  <span>Total</span>
                  <span>{formatPrice(cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0) + formData.shipping, store?.currency || 'INR')}</span>
                </div>
              </div>
              
              {/* Payment Method Selection */}
              <div className="mt-6 pt-4 border-t border-border-default">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Payment Method</h3>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-border-default rounded-lg cursor-pointer hover:bg-surface-base transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="razorpay"
                      checked={formData.paymentMethod === 'razorpay'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'razorpay' | 'cod' })}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <span className="text-text-primary font-medium">Online Payment</span>
                      <p className="text-xs text-text-secondary">Pay securely with Razorpay</p>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-border-default rounded-lg cursor-pointer hover:bg-surface-base transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'razorpay' | 'cod' })}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <span className="text-text-primary font-medium">Cash on Delivery (COD)</span>
                      <p className="text-xs text-text-secondary">Pay when you receive your order</p>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    {formData.paymentMethod === 'cod' ? 'Place COD Order' : 'Complete Order'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
