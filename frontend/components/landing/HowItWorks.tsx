'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { 
  ShoppingBag, 
  Link2, 
  Sparkles, 
  Rocket,
  ArrowRight,
  CheckCircle2,
  MousePointerClick,
  Settings,
  BarChart3
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Step {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
  details: string[];
  gradient: string;
  glowColor: string;
}

interface HowItWorksProps {
  onGetStarted: () => void;
}

const steps: Step[] = [
  {
    number: 1,
    icon: ShoppingBag,
    title: 'Browse & Select Products',
    description: 'Explore our curated catalog of winning products organized by profitable niches',
    details: [
      'Filter by category, price, or trend',
      'See profit margins upfront',
      'Access supplier information',
      'View product analytics'
    ],
    gradient: 'from-purple-500 to-purple-600',
    glowColor: 'shadow-purple-500/30',
  },
  {
    number: 2,
    icon: Link2,
    title: 'Connect Your Shopify Store',
    description: 'Securely link your Shopify store in seconds with our simple integration',
    details: [
      'One-click Shopify connection',
      'Secure API authentication',
      'Multiple store support',
      'Instant verification'
    ],
    gradient: 'from-blue-500 to-blue-600',
    glowColor: 'shadow-blue-500/30',
  },
  {
    number: 3,
    icon: Sparkles,
    title: 'Auto-Generate Your Store',
    description: 'Watch as we automatically populate your store with professional content',
    details: [
      'AI-powered descriptions',
      'Optimized product images',
      'SEO-friendly content',
      'Professional pricing'
    ],
    gradient: 'from-teal-500 to-teal-600',
    glowColor: 'shadow-teal-500/30',
  },
  {
    number: 4,
    icon: Rocket,
    title: 'Launch & Start Selling',
    description: 'Your store is live! Start accepting orders and growing your business',
    details: [
      'Instant store activation',
      'Payment processing ready',
      'Order management tools',
      'Analytics dashboard'
    ],
    gradient: 'from-pink-500 to-pink-600',
    glowColor: 'shadow-pink-500/30',
  },
];

const processFeatures = [
  { icon: MousePointerClick, label: 'One-Click Setup' },
  { icon: Settings, label: 'Zero Configuration' },
  { icon: BarChart3, label: 'Built-in Analytics' },
];

export default function HowItWorks({ onGetStarted }: HowItWorksProps) {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });
  
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.9], ['0%', '100%']);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
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
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      {/* Animated Blobs */}
      <motion.div 
        className="absolute top-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.span 
            className="inline-block px-4 py-1.5 rounded-full glass-card text-sm text-teal-400 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            Simple Process
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-gradient-purple">How It Works</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            Get your store up and running in 4 simple steps. 
            No technical skills required — we handle everything for you.
          </p>
          
          {/* Process Features */}
          <div className="flex flex-wrap justify-center gap-6">
            {processFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-2 text-text-secondary"
                >
                  <Icon className="w-5 h-5 text-purple-400" />
                  <span>{feature.label}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto relative">
          {/* Vertical Progress Line (Desktop) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/10 -translate-x-1/2">
            <motion.div 
              className="w-full bg-gradient-to-b from-purple-500 via-blue-500 via-teal-500 to-pink-500"
              style={{ height: lineHeight }}
            />
          </div>

          <motion.div 
            className="space-y-12 lg:space-y-24"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={step.number}
                  variants={itemVariants}
                  className={`relative flex flex-col lg:flex-row items-center gap-8 ${
                    isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Step Number Circle (Center on desktop) */}
                  <motion.div 
                    className="lg:absolute lg:left-1/2 lg:-translate-x-1/2 z-20"
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white font-bold text-xl shadow-xl ${step.glowColor}`}>
                      {step.number}
                    </div>
                  </motion.div>

                  {/* Content Card */}
                  <motion.div 
                    className={`flex-1 lg:w-[calc(50%-4rem)] ${isEven ? 'lg:pr-16' : 'lg:pl-16'}`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className={`glass-card rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all ${step.glowColor} hover:shadow-lg`}>
                      {/* Icon */}
                      <motion.div 
                        className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${step.gradient} mb-6`}
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </motion.div>
                      
                      {/* Title & Description */}
                      <h3 className="text-2xl font-bold text-white mb-3">
                        {step.title}
                      </h3>
                      <p className="text-text-secondary mb-6 leading-relaxed">
                        {step.description}
                      </p>
                      
                      {/* Details List */}
                      <ul className="space-y-3">
                        {step.details.map((detail, idx) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ delay: 0.5 + index * 0.2 + idx * 0.1 }}
                            className="flex items-center gap-3 text-sm text-text-secondary"
                          >
                            <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${
                              index === 0 ? 'text-purple-400' :
                              index === 1 ? 'text-blue-400' :
                              index === 2 ? 'text-teal-400' : 'text-pink-400'
                            }`} />
                            <span>{detail}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>

                  {/* Visual/Illustration Side */}
                  <div className={`flex-1 lg:w-[calc(50%-4rem)] hidden lg:flex ${isEven ? 'lg:pl-16 justify-start' : 'lg:pr-16 justify-end'}`}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.3 + index * 0.2 }}
                      className="glass-card rounded-2xl p-6 w-64 h-48 flex items-center justify-center"
                    >
                      <motion.div
                        animate={{ 
                          y: [0, -10, 0],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Icon className={`w-20 h-20 ${
                          index === 0 ? 'text-purple-400/50' :
                          index === 1 ? 'text-blue-400/50' :
                          index === 2 ? 'text-teal-400/50' : 'text-pink-400/50'
                        }`} />
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Arrow Connector (Mobile) */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden flex justify-center">
                      <motion.div
                        animate={{ y: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-6 h-6 text-text-muted rotate-90" />
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-center mt-20"
        >
          <p className="text-text-secondary mb-6">
            Ready to get started? It takes less than 5 minutes.
          </p>
          <motion.button
            onClick={onGetStarted}
            className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex items-center gap-2">
              Start Your Store Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
