'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import IconBadge, { IconBadgeVariant } from '@/components/IconBadge';
import type { LucideIcon } from 'lucide-react';
import { 
  Zap, 
  Shield, 
  Palette, 
  Globe, 
  HeadphonesIcon,
  BarChart3,
  Layers,
  RefreshCcw
} from 'lucide-react';

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: IconBadgeVariant;
  gradient: string;
}

interface FeaturesGridProps {
  features: Feature[];
  onGetStarted: () => void;
}

const additionalFeatures = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized performance ensures your store loads in milliseconds',
    stat: '< 1s',
    statLabel: 'Load Time',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption protects your data and customers',
    stat: '256-bit',
    statLabel: 'Encryption',
  },
  {
    icon: Palette,
    title: 'Custom Themes',
    description: 'Beautiful, conversion-optimized themes that match your brand',
    stat: '50+',
    statLabel: 'Templates',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Sell to customers worldwide with multi-currency support',
    stat: '150+',
    statLabel: 'Countries',
  },
  {
    icon: HeadphonesIcon,
    title: 'Priority Support',
    description: 'Get help when you need it with our dedicated support team',
    stat: '< 2hr',
    statLabel: 'Response',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Track sales, visitors, and conversions in real-time',
    stat: 'Real-time',
    statLabel: 'Data',
  },
  {
    icon: Layers,
    title: 'Inventory Sync',
    description: 'Automatic inventory management across all channels',
    stat: 'Auto',
    statLabel: 'Sync',
  },
  {
    icon: RefreshCcw,
    title: 'Auto Updates',
    description: 'Stay current with automatic product and pricing updates',
    stat: '24/7',
    statLabel: 'Updates',
  },
];

export default function FeaturesGrid({ features, onGetStarted }: FeaturesGridProps) {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    },
  };

  return (
    <section 
      ref={containerRef}
      className="py-24 md:py-32 bg-black relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      
      {/* Animated Background Elements */}
      <motion.div 
        className="absolute top-1/3 -left-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        animate={{ x: [0, 50, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-1/3 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        animate={{ x: [0, -50, 0], opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span 
            className="inline-block px-4 py-1.5 rounded-full glass-card text-sm text-blue-400 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            Everything You Need
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-gradient-blue">Powerful Features</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Everything you need to build, launch, and scale your Shopify store — 
            all in one powerful platform.
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group glass-card rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-500"
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <motion.div 
                  className={`relative mb-5 p-4 rounded-xl bg-gradient-to-br ${feature.gradient} w-fit`}
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                >
                  <IconBadge
                    icon={Icon}
                    label={feature.title}
                    variant={feature.variant ?? 'neutral'}
                    size="lg"
                    className="group-hover:scale-110 transition-transform"
                  />
                </motion.div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Additional Features with Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Built for <span className="text-gradient-teal">Performance</span>
            </h3>
            <p className="text-text-secondary">
              Industry-leading features that set us apart
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {additionalFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.6 + index * 0.08 }}
                  className="group glass-card rounded-xl p-5 border border-white/5 hover:border-white/20 transition-all shine-effect"
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className="w-6 h-6 text-text-muted group-hover:text-white transition-colors" />
                    </motion.div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{feature.stat}</div>
                      <div className="text-xs text-text-muted">{feature.statLabel}</div>
                    </div>
                  </div>
                  <h4 className="font-semibold text-white mb-1 text-sm">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Feature Highlight Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-8 md:p-10 text-center border border-purple-500/20 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10" />
            
            <div className="relative z-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="inline-block mb-4"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Ready to supercharge your store?
              </h3>
              <p className="text-text-secondary mb-6 max-w-xl mx-auto">
                Join thousands of successful merchants who have transformed their e-commerce business with our platform.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <motion.button
                  onClick={onGetStarted}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-3 rounded-full font-semibold transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started Free
                </motion.button>
                <Link href="/coming-soon">
                  <motion.button
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/20 px-6 py-3 rounded-full font-semibold transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View All Features
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
