'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { openRazorpayCheckout, formatAmount } from '@/lib/razorpay';
import { Plan, SubscriptionInfo, PlanCode } from '@/types';
import { notify } from '@/lib/toast';
import { useRouter } from 'next/navigation';

export default function BillingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansResponse, currentPlanResponse] = await Promise.all([
        api.getPlans().catch(() => ({ success: false, data: { plans: [] } })),
        api.getCurrentPlan().catch(() => ({ success: false, data: null })),
      ]);

      if (plansResponse.success && plansResponse.data) {
        setPlans(plansResponse.data.plans || []);
      }

      if (currentPlanResponse.success && currentPlanResponse.data) {
        setCurrentPlan(currentPlanResponse.data);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to load plans';
      notify.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planCode: PlanCode) => {
    try {
      setProcessing(planCode);

      // Create order
      const orderResponse = await api.createPaymentOrder(planCode);
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error('Failed to create order');
      }

      const { orderId, amount, currency, keyId } = orderResponse.data;

      // Open Razorpay checkout
      await openRazorpayCheckout(
        {
          key: keyId,
          amount: amount,
          currency: currency,
          name: 'Shopify Store Builder',
          description: `Subscription: ${plans.find(p => p.code === planCode)?.name || planCode}`,
          order_id: orderId,
          theme: {
            color: '#22c55e',
          },
        },
        async (response) => {
          try {
            // Verify payment
            const verifyResponse = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planCode: planCode,
            });

            if (verifyResponse.success) {
              notify.success('Payment successful! Subscription activated.');
              // Reload current plan
              await loadData();
              // Redirect to dashboard after a short delay
              setTimeout(() => {
                router.push('/dashboard');
              }, 2000);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Payment verification failed';
            notify.error(errorMessage);
          } finally {
            setProcessing(null);
          }
        },
        (error) => {
          notify.error(error?.message || 'Payment cancelled');
          setProcessing(null);
        }
      );
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to initiate payment';
      notify.error(errorMessage);
      setProcessing(null);
    }
  };

  const formatDuration = (days: number | null): string => {
    if (days === null) return 'Lifetime';
    if (days === 30) return '30 days';
    if (days === 90) return '3 months';
    return `${days} days`;
  };

  const formatProductLimit = (maxProducts: number | null): string => {
    if (maxProducts === null) return 'Unlimited';
    return `Up to ${maxProducts} products`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#F0F7EE]">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#F0F7EE] mb-4">Choose Your Plan</h1>
          <p className="text-[#d1d9d4] text-lg">
            Select a subscription plan that fits your needs
          </p>
        </div>

        {currentPlan && currentPlan.status === 'active' && (
          <div className="mb-8 bg-[#1AC8ED]/20 border border-[#1AC8ED]/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1AC8ED] font-semibold">Current Plan</p>
                <p className="text-[#F0F7EE]">
                  {plans.find(p => p.code === currentPlan.plan)?.name || 'Active Plan'}
                </p>
                {currentPlan.maxProducts !== null && (
                  <p className="text-[#d1d9d4] text-sm mt-1">
                    {currentPlan.productsAdded} / {currentPlan.maxProducts} products used
                  </p>
                )}
                {currentPlan.maxProducts === null && (
                  <p className="text-[#d1d9d4] text-sm mt-1">
                    {currentPlan.productsAdded} products added (Unlimited)
                  </p>
                )}
              </div>
              {currentPlan.planExpiresAt && !currentPlan.isLifetime && (
                <div className="text-right">
                  <p className="text-[#d1d9d4] text-sm">Expires on</p>
                  <p className="text-[#F0F7EE]">
                    {new Date(currentPlan.planExpiresAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.plan === plan.code;
            const isProcessing = processing === plan.code;

            return (
              <div
                key={plan.code}
                className={`bg-[#1a1a1a] rounded-lg p-8 border-2 ${
                  isCurrentPlan
                    ? 'border-[#1AC8ED]'
                    : 'border-[#5D737E] hover:border-[#1AC8ED]'
                } transition-all`}
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-[#F0F7EE] mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-[#1AC8ED] mb-2">
                    {formatAmount(plan.price)}
                  </div>
                  <p className="text-[#d1d9d4]">{formatDuration(plan.durationDays)}</p>
                  <p className="text-[#d1d9d4] mt-2">{formatProductLimit(plan.maxProducts)}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-[#1AC8ED] mr-2 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-[#F0F7EE]">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(plan.code)}
                  disabled={isCurrentPlan || isProcessing}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    isCurrentPlan
                      ? 'bg-[#1a1a1a] text-[#d1d9d4] cursor-not-allowed border border-[#5D737E]'
                      : isProcessing
                      ? 'bg-[#1AC8ED] text-white cursor-wait opacity-75'
                      : 'bg-[#1AC8ED] text-white hover:bg-[#17b4d5]'
                  }`}
                >
                  {isProcessing
                    ? 'Processing...'
                    : isCurrentPlan
                    ? 'Current Plan'
                    : 'Buy Now'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

