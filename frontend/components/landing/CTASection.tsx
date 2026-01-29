'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowRight, 
  Sparkles, 
  Rocket, 
  Gift,
  Clock,
  CheckCircle2,
  Zap
} from 'lucide-react';

interface CTASectionProps {
  onGetStarted: () => void;
}

const benefits = [
  'No credit card required',
  'Setup in under 5 minutes',
  'Cancel anytime',
  '30-day money-back guarantee',
];

export default function CTASection({ onGetStarted }: CTASectionProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  const handleScheduleDemo = () => {
    if (isAuthenticated) {
      router.push('/services/connect-experts');
    } else {
      router.push('/login');
    }
  };
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

  return (
    <section 
      ref={containerRef}
      className="py-24 md:py-32 bg-black relative overflow-hidden"
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-500/15 rounded-full blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>
      
      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 left-[10%] hidden lg:block"
        animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <div className="glass-card p-3 rounded-xl">
          <Rocket className="w-6 h-6 text-purple-400" />
        </div>
      </motion.div>
      
      <motion.div
        className="absolute bottom-20 right-[10%] hidden lg:block"
        animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      >
        <div className="glass-card p-3 rounded-xl">
          <Sparkles className="w-6 h-6 text-blue-400" />
        </div>
      </motion.div>
      
      <motion.div
        className="absolute top-1/2 left-[5%] hidden lg:block"
        animate={{ y: [5, -5, 5] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <div className="glass-card p-3 rounded-xl">
          <Gift className="w-6 h-6 text-pink-400" />
        </div>
      </motion.div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto"
          style={{ y, scale }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="glass-card rounded-3xl p-8 md:p-12 lg:p-16 text-center border border-purple-500/20 relative overflow-hidden"
          >
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />
            
            <div className="relative z-10">
              {/* Limited Time Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 mb-6"
              >
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">
                  Limited Time: Get 50% off your first month
                </span>
                <Zap className="w-4 h-4 text-yellow-400" />
              </motion.div>
              
              {/* Heading */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              >
                <span className="text-white">Ready to Launch Your</span>
                <br />
                <span className="text-gradient-purple">Dream Store?</span>
              </motion.h2>
              
              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto"
              >
                Join over 5,000+ successful entrepreneurs who have transformed their 
                e-commerce dreams into thriving businesses. Start your journey today.
              </motion.p>
              
              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10"
              >
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-2 text-sm text-text-secondary"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>{benefit}</span>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <motion.button
                  onClick={onGetStarted}
                  className="group relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-10 py-5 rounded-full font-bold text-lg transition-all shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 overflow-hidden"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Start Building Free
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </motion.button>
                
                <motion.button
                  onClick={handleScheduleDemo}
                  className="bg-white/5 hover:bg-white/10 text-white border-2 border-white/20 hover:border-white/40 px-10 py-5 rounded-full font-semibold text-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Schedule a Demo
                </motion.button>
              </motion.div>
              
              {/* Trust Note */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1 }}
                className="text-xs text-text-muted mt-6"
              >
                🔒 Secure checkout • 256-bit SSL encryption • Trusted by 5000+ merchants
              </motion.p>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-4 left-4 w-20 h-20 border border-white/5 rounded-full" />
            <div className="absolute bottom-4 right-4 w-32 h-32 border border-white/5 rounded-full" />
            <div className="absolute top-1/2 right-8 w-2 h-2 bg-purple-500/50 rounded-full" />
            <div className="absolute bottom-1/3 left-8 w-3 h-3 bg-blue-500/50 rounded-full" />
          </motion.div>
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          {[
            { value: '5 min', label: 'Average Setup Time' },
            { value: '₹0', label: 'To Get Started' },
            { value: '24/7', label: 'Support Available' },
            { value: '100%', label: 'Satisfaction Rate' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.3 + index * 0.1 }}
            >
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-text-muted">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

