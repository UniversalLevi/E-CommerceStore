'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  ShoppingBag, 
  Zap, 
  Shield,
  TrendingUp,
  Users,
  Star
} from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

const floatingElements = [
  { icon: ShoppingBag, delay: 0, x: '10%', y: '20%', color: 'text-purple-400' },
  { icon: Zap, delay: 0.5, x: '85%', y: '15%', color: 'text-blue-400' },
  { icon: Shield, delay: 1, x: '5%', y: '70%', color: 'text-teal-400' },
  { icon: TrendingUp, delay: 1.5, x: '90%', y: '60%', color: 'text-pink-400' },
  { icon: Star, delay: 2, x: '75%', y: '80%', color: 'text-yellow-400' },
];

const benefits = [
  'No coding required',
  'Ready in 5 minutes',
  '1000+ products',
  '24/7 support',
];

const trustedLogos = [
  'Shopify Partner',
  'SSL Secured',
  'GDPR Compliant',
  'PCI DSS',
];

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const [typedText, setTypedText] = useState('');
  const fullText = 'Build. Launch. Sell.';
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Typing animation
  useEffect(() => {
    if (!isInView) return;
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [isInView]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    },
  };

  const floatVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
  };

  return (
    <section 
      ref={containerRef}
      className="relative overflow-hidden min-h-screen flex items-center bg-black"
    >
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 gradient-mesh opacity-80" />
      
      {/* Animated Blobs */}
      <motion.div 
        className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-blob"
        style={{ y }}
      />
      <motion.div 
        className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob"
        style={{ animationDelay: '2s', y }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl animate-blob"
        style={{ animationDelay: '4s' }}
      />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      {/* Floating Icons */}
      {floatingElements.map((el, index) => {
        const Icon = el.icon;
        return (
          <motion.div
            key={index}
            className={`absolute hidden lg:flex items-center justify-center w-12 h-12 rounded-xl glass-card ${el.color}`}
            style={{ left: el.x, top: el.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 0.7, scale: 1 } : {}}
            transition={{ delay: el.delay, duration: 0.5 }}
            variants={floatVariants}
            whileInView="animate"
          >
            <Icon className="w-6 h-6" />
          </motion.div>
        );
      })}
      
      <motion.div 
        className="relative container mx-auto px-4 py-20 md:py-32 w-full z-10"
        style={{ opacity }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <motion.div 
                variants={itemVariants}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6 shine-effect"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </motion.div>
                <span className="text-sm text-text-secondary">
                  #1 Dropshipping Platform
                </span>
                <span className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-xs font-bold">
                  NEW
                </span>
              </motion.div>
              
              {/* Typing Text */}
              <motion.div 
                variants={itemVariants}
                className="mb-4"
              >
                <span className="text-2xl md:text-3xl font-mono text-purple-400 typing-cursor">
                  {typedText}
                </span>
              </motion.div>
              
              {/* Main Heading */}
              <motion.h1 
                variants={itemVariants}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.1]"
              >
                <span className="block text-gradient-purple glow-text">
                  Launch Your
                </span>
                <span className="block text-gradient-blue mt-2">
                  Dream Shopify
                </span>
                <span className="block text-white mt-2">
                  Store Today
                </span>
              </motion.h1>
              
              {/* Subtitle */}
              <motion.p 
                variants={itemVariants}
                className="text-lg md:text-xl text-text-secondary mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                Transform your e-commerce vision into reality. Browse our curated catalog of 
                <span className="text-white font-semibold"> 1000+ winning products</span>, 
                connect your Shopify store, and watch your business come to life — 
                <span className="text-purple-400 font-semibold"> all in under 5 minutes</span>.
              </motion.p>
              
              {/* Benefits List */}
              <motion.div 
                variants={itemVariants}
                className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8"
              >
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-center gap-2 text-sm text-text-secondary"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>{benefit}</span>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* CTA Buttons */}
              <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
              >
                <motion.button
                  onClick={onGetStarted}
                  className="group relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 min-h-[56px] flex items-center justify-center gap-2 overflow-hidden"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Start Building Free</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </motion.button>
                
                <Link href="/coming-soon">
                  <motion.button
                    className="group bg-white/5 backdrop-blur-md hover:bg-white/10 text-white border-2 border-white/20 hover:border-white/40 px-8 py-4 rounded-full font-semibold text-lg transition-all min-h-[56px] flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Play className="w-5 h-5" />
                    <span>Get Demo</span>
                  </motion.button>
                </Link>
              </motion.div>

              {/* Trust Badges */}
              <motion.div 
                variants={itemVariants}
                className="flex flex-wrap gap-6 justify-center lg:justify-start items-center"
              >
                <span className="text-xs text-text-muted uppercase tracking-wider">Trusted by:</span>
                {trustedLogos.map((logo, index) => (
                  <motion.span
                    key={logo}
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 0.5 } : {}}
                    transition={{ delay: 1.2 + index * 0.1 }}
                    whileHover={{ opacity: 1 }}
                    className="text-xs text-text-tertiary font-medium cursor-default transition-opacity"
                  >
                    {logo}
                  </motion.span>
                ))}
              </motion.div>
            </div>
            
            {/* Right - Enhanced Dashboard Mockup */}
            <motion.div 
              variants={itemVariants}
              className="relative hidden lg:block"
            >
              <motion.div 
                className="relative"
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* Main Dashboard Card */}
                <div className="relative glass-card rounded-3xl p-6 shadow-2xl tilt-card">
                  {/* Browser Header */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex gap-2">
                      <motion.div 
                        className="w-3 h-3 rounded-full bg-red-500"
                        whileHover={{ scale: 1.2 }}
                      />
                      <motion.div 
                        className="w-3 h-3 rounded-full bg-yellow-500"
                        whileHover={{ scale: 1.2 }}
                      />
                      <motion.div 
                        className="w-3 h-3 rounded-full bg-green-500"
                        whileHover={{ scale: 1.2 }}
                      />
                    </div>
                    <div className="flex-1 h-8 rounded-lg bg-white/5 ml-4 flex items-center px-3">
                      <span className="text-xs text-text-muted">yourstore.myshopify.com</span>
                    </div>
                  </div>
                  
                  {/* Dashboard Content */}
                  <div className="space-y-4">
                    {/* Header with Stats */}
                    <motion.div 
                      className="h-14 rounded-xl bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-teal-500/20 flex items-center justify-between px-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
                          <ShoppingBag className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-sm font-medium">Dashboard</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-400">● Live</span>
                      </div>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Revenue', value: '₹45,231', change: '+12%', color: 'text-green-400' },
                        { label: 'Orders', value: '156', change: '+8%', color: 'text-blue-400' },
                        { label: 'Products', value: '234', change: '+24', color: 'text-purple-400' },
                      ].map((stat, i) => (
                        <motion.div 
                          key={stat.label}
                          className="h-20 rounded-xl bg-white/5 border border-white/10 p-3 flex flex-col justify-between"
                          initial={{ opacity: 0, y: 20 }}
                          animate={isInView ? { opacity: 1, y: 0 } : {}}
                          transition={{ delay: 0.6 + i * 0.1 }}
                        >
                          <span className="text-xs text-text-muted">{stat.label}</span>
                          <div className="flex items-end justify-between">
                            <span className="text-lg font-bold">{stat.value}</span>
                            <span className={`text-xs ${stat.color}`}>{stat.change}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Product Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div 
                          key={i}
                          className="h-28 rounded-xl bg-white/5 border border-white/10 p-3 overflow-hidden"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={isInView ? { opacity: 1, scale: 1 } : {}}
                          transition={{ delay: 0.8 + i * 0.1 }}
                          whileHover={{ borderColor: 'rgba(124, 58, 237, 0.5)' }}
                        >
                          <div className="flex gap-2 h-full">
                            <div className="w-16 h-full rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20" />
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div className="space-y-1">
                                <div className="h-2 w-full bg-white/20 rounded" />
                                <div className="h-2 w-2/3 bg-white/10 rounded" />
                              </div>
                              <div className="h-2 w-1/2 bg-purple-500/30 rounded" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Action Bar */}
                    <motion.div 
                      className="flex gap-2"
                      initial={{ opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : {}}
                      transition={{ delay: 1.2 }}
                    >
                      <div className="flex-1 h-10 rounded-lg bg-gradient-to-r from-purple-600/50 to-blue-600/50 flex items-center justify-center">
                        <span className="text-xs font-medium">Add Products</span>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-text-muted" />
                      </div>
                    </motion.div>
                  </div>
                </div>
                
                {/* Floating Notification Card */}
                <motion.div
                  className="absolute -right-8 top-1/4 glass-card rounded-xl p-3 shadow-xl"
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
                  transition={{ delay: 1.4, type: 'spring' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">New Order!</p>
                      <p className="text-xs text-text-muted">₹2,499 • Just now</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Stats Card */}
                <motion.div
                  className="absolute -left-8 bottom-1/4 glass-card rounded-xl p-3 shadow-xl"
                  initial={{ opacity: 0, x: -20, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
                  transition={{ delay: 1.6, type: 'spring' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">Sales Up!</p>
                      <p className="text-xs text-green-400">+24% this week</p>
                    </div>
                  </div>
                </motion.div>
                
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-2xl opacity-20 -z-10 animate-pulse-glow" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        <motion.div
          className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-white/60"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
