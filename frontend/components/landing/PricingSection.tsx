'use client';

import { Check } from 'lucide-react';

interface Plan {
  code: string;
  name: string;
  price: number;
  durationDays: number | null;
  isLifetime: boolean;
  maxProducts: number | null;
  features: string[];
}

interface PricingSectionProps {
  plans: Plan[];
  loading: boolean;
  onGetStarted: () => void;
  formatPrice: (priceInPaise: number) => string;
}

export default function PricingSection({ plans, loading, onGetStarted, formatPrice }: PricingSectionProps) {
  if (loading) {
    return (
      <section className="py-20 md:py-32 bg-gradient-to-b from-black via-[#0D0D0D] to-black">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="text-text-secondary">Loading plans...</div>
          </div>
        </div>
      </section>
    );
  }

  if (plans.length === 0) {
    return (
      <section className="py-20 md:py-32 bg-gradient-to-b from-black via-[#0D0D0D] to-black">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="text-text-secondary">No plans available at the moment.</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-black via-[#0D0D0D] to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
            <span className="text-gradient-blue">Choose Your Plan</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Select the perfect plan for your business needs. All plans include full access to our product catalog.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const isPopular = index === 1; // Middle plan is popular
            const isLifetime = plan.isLifetime;
            
            return (
              <div
                key={plan.code}
                className={`relative glass-card glass-card-hover rounded-2xl p-8 transition-all duration-300 ${
                  isPopular
                    ? 'border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20 md:scale-105'
                    : 'border border-white/10'
                } animate-fadeInUp`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-text-primary mb-4">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gradient-purple">
                      {formatPrice(plan.price)}
                    </span>
                    {!isLifetime && plan.durationDays && (
                      <span className="text-text-secondary ml-2">
                        / {plan.durationDays === 30 ? 'month' : plan.durationDays === 90 ? 'quarter' : `${plan.durationDays} days`}
                      </span>
                    )}
                  </div>
                  {isLifetime && (
                    <div className="text-sm text-purple-400 font-semibold mb-2">
                      One-time payment
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-text-secondary">{feature}</span>
                    </li>
                  ))}
                  {plan.maxProducts !== null ? (
                    <li className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-text-secondary">
                        Up to {plan.maxProducts} products
                      </span>
                    </li>
                  ) : (
                    <li className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-text-secondary font-semibold">
                        Unlimited products
                      </span>
                    </li>
                  )}
                </ul>

                <button
                  onClick={onGetStarted}
                  className={`w-full py-4 px-6 rounded-full font-semibold text-lg transition-all ${
                    isPopular
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-white/5 hover:bg-white/10 text-text-primary border border-white/20 hover:border-white/40'
                  }`}
                >
                  Get Started
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

