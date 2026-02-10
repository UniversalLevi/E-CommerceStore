'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { notify } from '@/lib/toast';
import { Megaphone, Users, Check, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';

type TabType = 'ads_management' | 'connect_experts';
type AdsPlanType = 'monthly' | 'quarterly' | 'lifetime';
type ExpertsPlanType = 'monthly' | 'quarterly' | 'yearly';

interface AdsPlan {
  type: AdsPlanType;
  name: string;
  basePrice: number;
  commissionRate: number;
  duration: string;
  popular?: boolean;
}

interface ExpertsPlan {
  type: ExpertsPlanType;
  name: string;
  price: number;
  targetGoal: number;
  duration: string;
  popular?: boolean;
}

const adsPlans: AdsPlan[] = [
  {
    type: 'monthly',
    name: 'Monthly Plan',
    basePrice: 500000,
    commissionRate: 10,
    duration: '30 days',
  },
  {
    type: 'quarterly',
    name: 'Quarterly Plan',
    basePrice: 1000000,
    commissionRate: 8,
    duration: '90 days',
    popular: true,
  },
  {
    type: 'lifetime',
    name: 'Lifetime Plan',
    basePrice: 2000000,
    commissionRate: 5,
    duration: 'Lifetime',
  },
];

const expertsPlans: ExpertsPlan[] = [
  {
    type: 'monthly',
    name: 'Monthly Expert Connect',
    price: 1300000,
    targetGoal: 10000000,
    duration: '30 days',
  },
  {
    type: 'quarterly',
    name: 'Quarterly Expert Connect',
    price: 1900000,
    targetGoal: 60000000,
    duration: '90 days',
    popular: true,
  },
  {
    type: 'yearly',
    name: 'Yearly Expert Connect',
    price: 5000000,
    targetGoal: 200000000,
    duration: '365 days',
  },
];

const adsFeatures = [
  'Ad account setup & structure',
  'Audience research',
  'Creative strategy guidance',
  'Budget optimization',
  'Weekly performance reviews',
  'ROAS & conversion tracking',
];

const expertsFeatures = [
  'Scheduled expert calls',
  'Business audits',
  'Custom growth roadmap',
  'Performance checkpoints',
  'Priority support access',
];

export default function ServicesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('ads_management');
  const [adsProcessing, setAdsProcessing] = useState<AdsPlanType | null>(null);
  const [expertsProcessing, setExpertsProcessing] = useState<ExpertsPlanType | null>(null);

  const formatPrice = (priceInPaise: number) => {
    return `₹${(priceInPaise / 100).toLocaleString('en-IN')}`;
  };

  const formatGoal = (goalInPaise: number) => {
    const lakhs = goalInPaise / 10000000;
    if (lakhs >= 100) {
      const crores = lakhs / 100;
      return `₹${crores.toFixed(1)} Cr`;
    }
    return `₹${lakhs.toFixed(0)}L`;
  };

  const handleAdsPurchase = async (planType: AdsPlanType) => {
    if (!isAuthenticated) {
      notify.error('Please login to purchase');
      return;
    }

    try {
      setAdsProcessing(planType);

      const orderResponse = await api.createServiceOrder({
        serviceType: 'ads_management',
        planType: planType,
      });

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error('Failed to create service order');
      }

      const { orderId, amount } = orderResponse.data;

      const paymentResponse = await api.createServicePaymentOrder(orderId);
      if (!paymentResponse.success || !paymentResponse.data) {
        throw new Error('Failed to create payment order');
      }

      const { razorpayOrderId, keyId } = paymentResponse.data;

      await openRazorpayCheckout(
        {
          key: keyId,
          amount: amount,
          currency: 'INR',
          order_id: razorpayOrderId,
          name: 'EazyDS',
          description: `Ads Management - ${adsPlans.find(p => p.type === planType)?.name}`,
        },
        async (response: any) => {
          const verifyResponse = await api.verifyServicePayment(orderId, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verifyResponse.success) {
            notify.success('Payment successful! Your Ads Management service is now active.');
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
      notify.error(error.response?.data?.message || 'Failed to initiate payment');
      console.error('Purchase error:', error);
    } finally {
      setAdsProcessing(null);
    }
  };

  const handleExpertsPurchase = async (planType: ExpertsPlanType) => {
    if (!isAuthenticated) {
      notify.error('Please login to purchase');
      return;
    }

    try {
      setExpertsProcessing(planType);

      const plan = expertsPlans.find(p => p.type === planType);
      if (!plan) {
        throw new Error('Invalid plan');
      }

      const orderResponse = await api.createServiceOrder({
        serviceType: 'connect_experts',
        planType: planType,
        targetGoal: plan.targetGoal,
      });

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error('Failed to create service order');
      }

      const { orderId, amount } = orderResponse.data;

      const paymentResponse = await api.createServicePaymentOrder(orderId);
      if (!paymentResponse.success || !paymentResponse.data) {
        throw new Error('Failed to create payment order');
      }

      const { razorpayOrderId, keyId } = paymentResponse.data;

      await openRazorpayCheckout(
        {
          key: keyId,
          amount: amount,
          currency: 'INR',
          order_id: razorpayOrderId,
          name: 'EazyDS',
          description: `Connect with Experts - ${plan.name}`,
        },
        async (response: any) => {
          const verifyResponse = await api.verifyServicePayment(orderId, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verifyResponse.success) {
            notify.success('Payment successful! Your Expert Connect service is now active.');
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
      notify.error(error.response?.data?.message || 'Failed to initiate payment');
      console.error('Purchase error:', error);
    } finally {
      setExpertsProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Growth Solutions</h1>
        <p className="mt-2 text-text-secondary">Choose the service that fits your business needs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-default">
        <button
          onClick={() => setActiveTab('ads_management')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
            activeTab === 'ads_management'
              ? 'border-purple-500 text-purple-400 font-semibold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Megaphone className="w-5 h-5" />
          Ads Management
        </button>
        <button
          onClick={() => setActiveTab('connect_experts')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
            activeTab === 'connect_experts'
              ? 'border-purple-500 text-purple-400 font-semibold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Users className="w-5 h-5" />
          Connect with Experts
        </button>
      </div>

      {/* Ads Management Tab */}
      {activeTab === 'ads_management' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Service Description */}
          <div className="glass-card rounded-lg p-6 border border-border-default">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Megaphone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Ads Management Services</h2>
                <p className="text-text-secondary">Performance-driven ad management with transparent pricing and shared growth incentives.</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-text-secondary leading-relaxed">
                This is <strong className="text-white">execution</strong>, not advice. We plan, launch, optimize, and scale your ads while aligning our success with your ad spend.
              </p>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="grid md:grid-cols-3 gap-6">
            {adsPlans.map((plan) => (
              <div
                key={plan.type}
                className={`relative glass-card rounded-xl p-6 border transition-all ${
                  plan.popular
                    ? 'border-purple-500/50 shadow-lg'
                    : 'border-border-default hover:border-border-hover'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-text-primary mb-2">{plan.name}</h3>
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-gradient-purple">
                      {formatPrice(plan.basePrice)}
                    </span>
                    <span className="text-text-secondary ml-2 text-sm">/ {plan.duration === 'Lifetime' ? 'one-time' : plan.duration}</span>
                  </div>
                  <div className="text-text-secondary text-sm">
                    <span className="text-white font-semibold">+ {plan.commissionRate}%</span> of ad budget
                  </div>
                  {plan.type === 'monthly' && (
                    <p className="text-xs text-text-secondary mt-2">Best for testing and early-stage scaling</p>
                  )}
                  {plan.type === 'quarterly' && (
                    <p className="text-xs text-text-secondary mt-2">Better optimization cycles & consistency</p>
                  )}
                  {plan.type === 'lifetime' && (
                    <p className="text-xs text-text-secondary mt-2">Long-term partners with lower commission</p>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {adsFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleAdsPurchase(plan.type)}
                  disabled={adsProcessing === plan.type}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border-default'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {adsProcessing === plan.type ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Get Ads Managed
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connect with Experts Tab */}
      {activeTab === 'connect_experts' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Service Description */}
          <div className="glass-card rounded-lg p-6 border border-border-default">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Connect with Experts</h2>
                <p className="text-text-secondary">Direct access to industry experts focused on achieving real sales milestones.</p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-text-secondary leading-relaxed mb-3">
                  You get connected with experts in:
                </p>
                <ul className="space-y-2 text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Ads & performance marketing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Funnel optimization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Store & offer optimization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Scaling strategy</span>
                  </li>
                </ul>
              </div>
              <p className="text-text-secondary leading-relaxed">
                <strong className="text-white">Experts:</strong> Review your business, define an action plan, track progress against goals, and adjust strategy as needed.
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-yellow-400 mb-1">Important Disclaimer</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Sales targets are <strong className="text-white">benchmarks, not guarantees</strong>. Results depend on execution, market conditions, and ad spend.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="grid md:grid-cols-3 gap-6">
            {expertsPlans.map((plan) => (
              <div
                key={plan.type}
                className={`relative glass-card rounded-xl p-6 border transition-all ${
                  plan.popular
                    ? 'border-purple-500/50 shadow-lg'
                    : 'border-border-default hover:border-border-hover'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-text-primary mb-2">{plan.name}</h3>
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-gradient-purple">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-text-secondary ml-2 text-sm">/ {plan.duration}</span>
                  </div>
                  <div className="bg-green-500/20 text-green-400 rounded-full px-3 py-1.5 inline-block mb-2">
                    <span className="font-semibold text-sm">Target: {formatGoal(plan.targetGoal)}</span>
                  </div>
                  {plan.type === 'monthly' && (
                    <p className="text-xs text-text-secondary mt-2">Best for early validation & guidance</p>
                  )}
                  {plan.type === 'quarterly' && (
                    <p className="text-xs text-text-secondary mt-2">For businesses ready to scale steadily</p>
                  )}
                  {plan.type === 'yearly' && (
                    <p className="text-xs text-text-secondary mt-2">Long-term growth & system building</p>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {expertsFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleExpertsPurchase(plan.type)}
                  disabled={expertsProcessing === plan.type}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border-default'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {expertsProcessing === plan.type ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Connect With Experts
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
