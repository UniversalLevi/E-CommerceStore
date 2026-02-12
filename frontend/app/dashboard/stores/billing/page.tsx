'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { openRazorpayCheckout, formatAmount } from '@/lib/razorpay';
import { PlanCode } from '@/types';
import { notify } from '@/lib/toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface StorePlan {
  code: string;
  name: string;
  price: number;
  durationDays: number | null;
  isLifetime: boolean;
  maxProducts: number | null;
  features: string[];
}

interface StoreSubscriptionInfo {
  planCode: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string | null;
  renewalDate: string | null;
  amountPaid: number;
  razorpaySubscriptionId: string | null;
}

export default function StoreBillingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<StorePlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<StoreSubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansResponse, currentPlanResponse] = await Promise.all([
        api.getStorePlans().catch(() => ({ success: false, data: { plans: [] } })),
        api.getCurrentStorePlan().catch(() => ({ success: false, data: null })),
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
    // Handle free plan
    if (planCode === 'stores_basic_free') {
      try {
        setProcessing(planCode);
        // Create free subscription via API
        const subscriptionResponse = await api.createSubscription(planCode);
        if (subscriptionResponse.success) {
          notify.success('Free plan activated successfully!');
          await loadData();
          setTimeout(() => {
            router.push('/dashboard/stores');
          }, 1000);
        } else {
          throw new Error('Failed to activate free plan');
        }
        setProcessing(null);
        return;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to activate free plan';
        notify.error(errorMessage);
        setProcessing(null);
        return;
      }
    }

    try {
      setProcessing(planCode);

      // Create subscription
      const subscriptionResponse = await api.createSubscription(planCode);
      if (!subscriptionResponse.success || !subscriptionResponse.data) {
        throw new Error('Failed to create subscription');
      }

      const { subscriptionId, mainSubscriptionId, amount, currency, keyId } = subscriptionResponse.data;
      
      // Validate required data
      if (!subscriptionId || !keyId) {
        throw new Error('Missing required payment data from server');
      }

      const plan = plans.find(p => p.code === planCode);
      const planName = plan?.name || planCode || 'Subscription';

      // Open Razorpay checkout with subscription_id for UPI autopay mandate
      await openRazorpayCheckout(
        {
          key: keyId,
          currency: currency || 'INR',
          name: 'EazyDS Stores',
          description: `Purchase ${planName}`,
          subscription_id: subscriptionId,
          theme: {
            color: '#ffffff',
          },
        },
        async (response) => {
          try {
            // Verify payment
            const verifyResponse = await api.verifySubscriptionPayment({
              ...(response.razorpay_order_id && { razorpay_order_id: response.razorpay_order_id }),
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planCode: planCode,
              subscription_id: subscriptionId,
            });

            if (verifyResponse.success) {
              notify.success(`Plan purchased successfully! Your store subscription is now active.`);
              // Reload current plan
              await loadData();
              // Redirect to stores after a short delay
              setTimeout(() => {
                router.push('/dashboard/stores');
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
    if (days === null) return 'Free Forever';
    if (days === 90) return '3 months';
    return `${days} days`;
  };

  const formatPrice = (plan: StorePlan): string => {
    if (plan.price === 0) return 'Free';
    return formatAmount(plan.price);
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
        <Link
          href="/dashboard/stores"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Stores
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-4">Choose Your Store Plan</h1>
          <p className="text-text-secondary text-lg">
            Select a subscription plan for your Eazy Stores
          </p>
        </div>

        {currentPlan && currentPlan.status === 'active' && (
          <div className="mb-8 bg-secondary-500/20 border border-secondary-500/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-400 font-semibold">Current Store Plan</p>
                <p className="text-text-primary">
                  {currentPlan.planName}
                </p>
                {currentPlan.endDate && (
                  <p className="text-text-muted text-sm mt-1">
                    Expires on {new Date(currentPlan.endDate).toLocaleDateString()}
                  </p>
                )}
                {!currentPlan.endDate && (
                  <p className="text-text-muted text-sm mt-1">
                    Active (No expiration)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.planCode === plan.code;
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
                    {plan.price === 0 ? 'Free' : formatAmount(plan.price)}
                  </div>
                  <p className="text-text-secondary">{formatDuration(plan.durationDays)}</p>
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
                  onClick={() => handlePurchase(plan.code as PlanCode)}
                  disabled={isCurrentPlan || processing === plan.code}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    isCurrentPlan
                      ? 'bg-surface-raised text-text-muted cursor-not-allowed border border-border-default'
                      : processing === plan.code
                      ? 'bg-primary-500 text-black cursor-wait opacity-75'
                      : plan.price === 0
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-primary-500 text-black hover:bg-primary-600'
                  }`}
                >
                  {processing === plan.code
                    ? 'Processing...'
                    : isCurrentPlan
                    ? 'Current Plan'
                    : plan.price === 0
                    ? 'Activate Free Plan'
                    : `Purchase Plan – ${formatPrice(plan)}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
