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
            color: '#ffffff',
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
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-text-primary">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-4">Choose Your Plan</h1>
          <p className="text-text-secondary text-lg">
            Select a subscription plan that fits your needs
          </p>
        </div>

        {currentPlan && currentPlan.status === 'active' && (
          <div className="mb-8 bg-secondary-500/20 border border-secondary-500/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-400 font-semibold">Current Plan</p>
                <p className="text-text-primary">
                  {plans.find(p => p.code === currentPlan.plan)?.name || 'Active Plan'}
                </p>
                {currentPlan.maxProducts !== null && (
                  <p className="text-text-muted text-sm mt-1">
                    {currentPlan.productsAdded} / {currentPlan.maxProducts} products used
                  </p>
                )}
                {currentPlan.maxProducts === null && (
                  <p className="text-text-muted text-sm mt-1">
                    {currentPlan.productsAdded} products added (Unlimited)
                  </p>
                )}
              </div>
              {currentPlan.planExpiresAt && !currentPlan.isLifetime && (
                <div className="text-right">
                  <p className="text-text-muted text-sm">Expires on</p>
                  <p className="text-text-primary">
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
                className={`bg-surface-raised rounded-lg p-8 border-2 ${
                  isCurrentPlan
                    ? 'border-primary-500'
                    : 'border-border-default hover:border-primary-500'
                } transition-all`}
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-text-primary mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-primary-500 mb-2">
                    {formatAmount(plan.price)}
                  </div>
                  <p className="text-text-secondary">{formatDuration(plan.durationDays)}</p>
                  <p className="text-text-secondary mt-2">{formatProductLimit(plan.maxProducts)}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0"
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
                      <span className="text-text-primary">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(plan.code)}
                  disabled={isCurrentPlan || isProcessing}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    isCurrentPlan
                      ? 'bg-surface-raised text-text-muted cursor-not-allowed border border-border-default'
                      : isProcessing
                      ? 'bg-primary-500 text-black cursor-wait opacity-75'
                      : 'bg-primary-500 text-black hover:bg-primary-600'
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

