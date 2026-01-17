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

      // Create trial subscription
      const subscriptionResponse = await api.createTrialSubscription(planCode);
      if (!subscriptionResponse.success || !subscriptionResponse.data) {
        throw new Error('Failed to create trial subscription');
      }

      const { subscriptionId, mainSubscriptionId, amount, currency, keyId, trialDays, trialEndsAt } = subscriptionResponse.data;
      
      // Validate required data
      if (!subscriptionId || !keyId) {
        throw new Error('Missing required payment data from server');
      }
      
      // Debug: Log amounts to verify
      const expectedAmount = 2000; // ₹20 in paise
      const actualAmount = amount;
      const isAmountCorrect = actualAmount === expectedAmount;
      
      console.log('Subscription payment data:', {
        subscriptionId, // Token charge subscription (₹20)
        mainSubscriptionId, // Main subscription (charged after trial)
        amount: actualAmount,
        amount_rupees: `₹${actualAmount / 100}`,
        expected_amount: expectedAmount,
        expected_amount_rupees: `₹${expectedAmount / 100}`,
        is_amount_correct: isAmountCorrect,
        currency,
      });
      
      // Display warning if amount is incorrect
      if (!isAmountCorrect) {
        console.error('⚠️ WARNING: Token amount mismatch!');
        console.error(`   Expected: ₹${expectedAmount / 100} (${expectedAmount} paise)`);
        console.error(`   Received from server: ₹${actualAmount / 100} (${actualAmount} paise)`);
        console.error('   This indicates the Razorpay token plan is configured incorrectly.');
        console.error('   The checkout will show ₹' + (actualAmount / 100) + ' instead of ₹20.');
        notify.error(`Warning: Token amount is ₹${actualAmount / 100} instead of ₹20. Please contact support.`);
      }

      const plan = plans.find(p => p.code === planCode);
      const planName = plan?.name || planCode || 'Subscription';

      // Open Razorpay checkout with subscription_id for UPI autopay mandate
      // NOTE: We don't pass order_id when subscription_id is present
      // This is required for UPI autopay to show. Razorpay will use subscription's authorization amount.
      await openRazorpayCheckout(
        {
          key: keyId,
          amount: amount, // ₹20 token charge (Razorpay may use subscription's authorization amount instead)
          currency: currency || 'INR',
          name: 'EAZY DROPSHIPPING',
          description: `Trial activation + UPI autopay mandate: ${planName}`,
          // order_id: orderId, // REMOVED - prevents UPI from showing when subscription_id is present
          subscription_id: subscriptionId, // Critical for UPI autopay mandate
          theme: {
            color: '#ffffff',
          },
        },
        async (response) => {
          try {
            // Verify ₹20 token payment
            // Note: For subscription payments, order_id might not be in response
            // But we still pass it if available for verification
            const verifyResponse = await api.verifyPayment({
              ...(response.razorpay_order_id && { razorpay_order_id: response.razorpay_order_id }), // Optional for subscription payments
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planCode: planCode,
              subscription_id: subscriptionId, // Required for subscription payment verification
            });

            if (verifyResponse.success) {
              notify.success(`Trial started! You have ${trialDays} days free. Full amount will be auto-debited via UPI after trial.`);
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

        {currentPlan && (currentPlan.status === 'active' || currentPlan.status === 'trialing') && (
          <div className="mb-8 bg-secondary-500/20 border border-secondary-500/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-400 font-semibold">
                  {currentPlan.status === 'trialing' ? 'Trial Active' : 'Current Plan'}
                </p>
                <p className="text-text-primary">
                  {plans.find(p => p.code === currentPlan.plan)?.name || 'Active Plan'}
                </p>
                {currentPlan.isTrialing && currentPlan.trialEndsAt && (
                  <p className="text-green-400 text-sm mt-1 font-semibold">
                    Trial ends: {new Date(currentPlan.trialEndsAt).toLocaleDateString()}
                  </p>
                )}
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
              {currentPlan.planExpiresAt && !currentPlan.isLifetime && !currentPlan.isTrialing && (
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
                  {plan.trialDays && plan.trialDays > 0 && (
                    <p className="text-green-400 font-semibold mt-2">
                      {plan.trialDays}-day free trial
                    </p>
                  )}
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
                    : plan.trialDays && plan.trialDays > 0
                    ? `Start Free Trial – ₹20 Today`
                    : 'Buy Now'}
                </button>
                {plan.trialDays && plan.trialDays > 0 && !isCurrentPlan && (
                  <p className="text-xs text-text-muted mt-2 text-center">
                    ₹20 charged now to activate trial.
                    <br />
                    {plan.price <= 500000 ? (
                      <>
                        Full amount (₹{plan.price / 100}) auto-debited via UPI after {plan.trialDays} days unless cancelled.
                      </>
                    ) : (
                      <>
                        Full amount (₹{plan.price / 100}) will be charged after {plan.trialDays} days.
                        <br />
                        <span className="text-yellow-400">Note: UPI AutoPay only supports amounts ≤ ₹5,000. Card payment required for this plan.</span>
                      </>
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

