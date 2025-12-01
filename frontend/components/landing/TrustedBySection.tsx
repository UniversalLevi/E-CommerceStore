'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  ShieldCheck, 
  Award, 
  Globe2, 
  Lock,
  CreditCard,
  CheckCircle2
} from 'lucide-react';

const partners = [
  { name: 'Shopify', logo: 'Shopify' },
  { name: 'Stripe', logo: 'Stripe' },
  { name: 'Razorpay', logo: 'Razorpay' },
  { name: 'PayPal', logo: 'PayPal' },
  { name: 'AWS', logo: 'AWS' },
  { name: 'Cloudflare', logo: 'Cloudflare' },
  { name: 'Google Cloud', logo: 'Google' },
  { name: 'Meta', logo: 'Meta' },
];

const certifications = [
  { icon: ShieldCheck, label: 'Shopify Partner', color: 'text-green-400' },
  { icon: Lock, label: 'SSL Secured', color: 'text-blue-400' },
  { icon: Award, label: 'ISO 27001', color: 'text-purple-400' },
  { icon: Globe2, label: 'GDPR Compliant', color: 'text-teal-400' },
  { icon: CreditCard, label: 'PCI DSS', color: 'text-pink-400' },
  { icon: CheckCircle2, label: 'SOC 2 Type II', color: 'text-orange-400' },
];

const pressLogos = [
  'TechCrunch',
  'Forbes',
  'YourStory',
  'Inc42',
  'Economic Times',
  'Mint',
];

export default function TrustedBySection() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  return (
    <section 
      ref={containerRef}
      className="py-20 bg-black relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Partners Marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-center text-text-muted text-sm uppercase tracking-widest mb-8">
            Trusted by leading platforms & partners
          </p>
          
          {/* Infinite Scroll Marquee */}
          <div className="relative overflow-hidden">
            {/* Gradient Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
            
            <div className="flex animate-marquee">
              {[...partners, ...partners].map((partner, index) => (
                <div
                  key={`${partner.name}-${index}`}
                  className="flex-shrink-0 mx-8 md:mx-12"
                >
                  <div className="glass-card px-8 py-4 rounded-xl">
                    <span className="text-xl md:text-2xl font-bold text-text-secondary/50 hover:text-text-secondary transition-colors">
                      {partner.logo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <p className="text-center text-text-muted text-sm uppercase tracking-widest mb-8">
            Security & Compliance
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {certifications.map((cert, index) => {
              const Icon = cert.icon;
              return (
                <motion.div
                  key={cert.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 glass-card rounded-full hover:bg-white/5 transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  <Icon className={`w-4 h-4 ${cert.color}`} />
                  <span className="text-sm text-text-secondary">{cert.label}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Press Mentions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <p className="text-center text-text-muted text-sm uppercase tracking-widest mb-8">
            As Featured In
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {pressLogos.map((logo, index) => (
              <motion.span
                key={logo}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 0.4 } : {}}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ opacity: 1 }}
                className="text-lg md:text-xl font-semibold text-text-tertiary cursor-default transition-opacity"
              >
                {logo}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Trust Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: '99.9%', label: 'Uptime SLA' },
                { value: '256-bit', label: 'Encryption' },
                { value: '24/7', label: 'Monitoring' },
                { value: '< 50ms', label: 'Response Time' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.9 + index * 0.1 }}
                >
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs text-text-muted">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

