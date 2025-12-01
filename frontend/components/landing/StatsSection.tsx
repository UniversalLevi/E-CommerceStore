'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  ShoppingBag, 
  Zap, 
  Globe, 
  Users, 
  Star, 
  TrendingUp,
  Package,
  Clock
} from 'lucide-react';

interface CounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

function AnimatedCounter({ end, suffix = '', prefix = '', duration = 2 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

const stats = [
  {
    icon: ShoppingBag,
    value: 1000,
    suffix: '+',
    label: 'Products Available',
    description: 'Curated winning products ready to sell',
    gradient: 'from-purple-500/20 to-purple-600/20',
    iconColor: 'text-purple-400',
    borderColor: 'hover:border-purple-500/50',
  },
  {
    icon: Zap,
    value: 5,
    suffix: ' Min',
    label: 'Setup Time',
    description: 'From signup to live store',
    gradient: 'from-blue-500/20 to-blue-600/20',
    iconColor: 'text-blue-400',
    borderColor: 'hover:border-blue-500/50',
  },
  {
    icon: Users,
    value: 5000,
    suffix: '+',
    label: 'Happy Merchants',
    description: 'Store owners trust us daily',
    gradient: 'from-teal-500/20 to-teal-600/20',
    iconColor: 'text-teal-400',
    borderColor: 'hover:border-teal-500/50',
  },
  {
    icon: Globe,
    value: 24,
    suffix: '/7',
    label: 'Support Available',
    description: 'We\'re here whenever you need us',
    gradient: 'from-pink-500/20 to-pink-600/20',
    iconColor: 'text-pink-400',
    borderColor: 'hover:border-pink-500/50',
  },
];

const additionalStats = [
  { icon: Star, value: '4.9', label: 'User Rating' },
  { icon: TrendingUp, value: '₹50L+', label: 'Revenue Generated' },
  { icon: Package, value: '10K+', label: 'Orders Fulfilled' },
  { icon: Clock, value: '99.9%', label: 'Uptime' },
];

export default function StatsSection() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <section 
      ref={containerRef}
      className="py-24 md:py-32 bg-black relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span 
            className="inline-block px-4 py-1.5 rounded-full glass-card text-sm text-purple-400 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            Trusted Platform
          </motion.span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-gradient-purple">Numbers That</span>{' '}
            <span className="text-white">Speak</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Join thousands of successful store owners who have transformed their e-commerce dreams into reality
          </p>
        </motion.div>

        {/* Main Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`group glass-card rounded-2xl p-6 text-center transition-all duration-500 border border-white/10 ${stat.borderColor} hover:bg-white/5`}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <motion.div 
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} mb-4`}
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className={`w-8 h-8 ${stat.iconColor}`} />
                </motion.div>
                
                <div className="text-4xl md:text-5xl font-bold text-gradient-purple mb-2">
                  <AnimatedCounter 
                    end={stat.value} 
                    suffix={stat.suffix}
                  />
                </div>
                
                <div className="text-white font-semibold text-lg mb-1">
                  {stat.label}
                </div>
                
                <p className="text-text-secondary text-sm">
                  {stat.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Additional Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {additionalStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-text-muted" />
                      <span className="text-2xl md:text-3xl font-bold text-white">
                        {stat.value}
                      </span>
                    </div>
                    <span className="text-sm text-text-secondary">{stat.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Floating Particles */}
        <div className="absolute top-1/4 left-10 w-2 h-2 bg-purple-500/30 rounded-full animate-float" />
        <div className="absolute bottom-1/4 right-10 w-3 h-3 bg-blue-500/30 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-teal-500/30 rounded-full animate-float" style={{ animationDelay: '2s' }} />
      </div>
    </section>
  );
}
