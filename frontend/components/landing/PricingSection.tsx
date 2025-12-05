'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Sparkles, 
  Zap, 
  Crown, 
  ArrowRight,
  Shield,
  Clock,
  Users
} from 'lucide-react';

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

const planIcons: Record<string, typeof Sparkles> = {
  'starter': Sparkles,
  'pro': Zap,
  'premium': Crown,
  'lifetime': Crown,
};

const planColors: Record<string, { gradient: string; glow: string; badge: string }> = {
  'starter': { 
    gradient: 'from-blue-600 to-blue-500', 
    glow: 'shadow-blue-500/25',
    badge: 'bg-blue-500/20 text-blue-400'
  },
  'pro': { 
    gradient: 'from-purple-600 to-blue-600', 
    glow: 'shadow-purple-500/25',
    badge: 'bg-purple-500/20 text-purple-400'
  },
  'premium': { 
    gradient: 'from-amber-500 to-orange-500', 
    glow: 'shadow-amber-500/25',
    badge: 'bg-amber-500/20 text-amber-400'
  },
  'lifetime': { 
    gradient: 'from-pink-600 to-purple-600', 
    glow: 'shadow-pink-500/25',
    badge: 'bg-pink-500/20 text-pink-400'
  },
};

const guarantees = [
  { icon: Shield, label: '30-Day Money Back' },
  { icon: Clock, label: 'Cancel Anytime' },
  { icon: Users, label: '24/7 Support' },
];

export default function PricingSection({ plans, loading, onGetStarted, formatPrice }: PricingSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  if (loading) {
    return (
      <section className="py-24 md:py-32 bg-black relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center py-12">
            <motion.div 
              className="inline-flex items-center gap-3"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-text-secondary">Loading plans...</span>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  if (plans.length === 0) {
    return (
      <section className="py-24 md:py-32 bg-black relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center py-12">
            <div className="text-text-secondary">No plans available at the moment.</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      id="pricing-plans"
      ref={containerRef}
      className="py-24 md:py-32 bg-black relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      
      {/* Animated Blobs */}
      <motion.div 
        className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.span 
            className="inline-block px-4 py-1.5 rounded-full glass-card text-sm text-blue-400 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Simple Pricing
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-gradient-blue">Choose Your Plan</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            Select the perfect plan for your business needs. 
            All plans include full access to our product catalog.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 glass-card rounded-full">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'monthly' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'yearly' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              Yearly
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-16">
          <AnimatePresence mode="popLayout">
            {plans.map((plan, index) => {
              const isPopular = index === 1;
              const isLifetime = plan.isLifetime;
              const planKey = plan.code.toLowerCase();
              const colors = planColors[planKey] || planColors['starter'];
              const Icon = planIcons[planKey] || Sparkles;
              
              return (
                <motion.div
                  key={plan.code}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className={`relative glass-card rounded-3xl p-8 transition-all duration-500 ${
                    isPopular
                      ? `border-2 border-purple-500/50 ${colors.glow} shadow-2xl md:scale-105`
                      : 'border border-white/10 hover:border-white/20'
                  }`}
                  onMouseEnter={() => setHoveredPlan(plan.code)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  whileHover={{ y: isPopular ? 0 : -8 }}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <motion.div 
                      className="absolute -top-4 left-1/2 -translate-x-1/2 z-10"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className={`bg-gradient-to-r ${colors.gradient} text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2`}>
                        <Sparkles className="w-4 h-4" />
                        Most Popular
                      </span>
                    </motion.div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <motion.div
                      className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${colors.gradient} mb-4`}
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    
                    <div className="mb-2">
                      <span className="text-5xl font-bold text-gradient-purple">
                        {formatPrice(billingPeriod === 'yearly' ? plan.price * 0.8 : plan.price)}
                      </span>
                      {!isLifetime && plan.durationDays && (
                        <span className="text-text-secondary ml-2">
                          / {plan.durationDays === 30 ? 'month' : plan.durationDays === 90 ? 'quarter' : `${plan.durationDays} days`}
                        </span>
                      )}
                    </div>
                    
                    {isLifetime && (
                      <motion.div 
                        className={`inline-block px-3 py-1 ${colors.badge} rounded-full text-sm font-semibold`}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        One-time payment
                      </motion.div>
                    )}
                    
                    {billingPeriod === 'yearly' && !isLifetime && (
                      <div className="text-sm text-green-400 mt-2">
                        Save {formatPrice(plan.price * 12 * 0.2)} per year
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <motion.li 
                        key={idx} 
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                      >
                        <div className={`mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center flex-shrink-0`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-text-secondary">{feature}</span>
                      </motion.li>
                    ))}
                    
                    {/* Product Limit */}
                    <motion.li 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + plan.features.length * 0.05 }}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center flex-shrink-0`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className={`${plan.maxProducts === null ? 'text-white font-semibold' : 'text-text-secondary'}`}>
                        {plan.maxProducts !== null 
                          ? `Up to ${plan.maxProducts} products` 
                          : 'Unlimited products'}
                      </span>
                    </motion.li>
                  </ul>

                  {/* CTA Button */}
                  <motion.button
                    onClick={onGetStarted}
                    className={`w-full py-4 px-6 rounded-full font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                      isPopular
                        ? `bg-gradient-to-r ${colors.gradient} text-white shadow-lg ${colors.glow}`
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/20 hover:border-white/40'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get Started
                    <ArrowRight className={`w-5 h-5 ${hoveredPlan === plan.code ? 'translate-x-1' : ''} transition-transform`} />
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Guarantees */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-8 mb-12"
        >
          {guarantees.map((guarantee, index) => {
            const Icon = guarantee.icon;
            return (
              <motion.div
                key={guarantee.label}
                className="flex items-center gap-2 text-text-secondary"
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <Icon className="w-5 h-5 text-green-400" />
                <span>{guarantee.label}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center"
        >
          <p className="text-text-secondary mb-4">
            Need a custom solution for your enterprise?
          </p>
          <Link href="/coming-soon">
            <motion.button
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              whileHover={{ x: 4 }}
            >
              Contact Sales <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
