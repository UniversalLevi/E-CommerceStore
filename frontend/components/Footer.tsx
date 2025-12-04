'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { 
  Twitter, 
  Instagram,
  Mail,
  MapPin,
  Phone,
  Heart,
} from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Browse Products', href: '/products' },
    { label: 'Features', href: '/features' },
    // Pricing will scroll to plans on the home page using an anchor
    { label: 'Pricing', href: '/#pricing-plans' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  resources: [
    { label: 'Help Center', href: '/dashboard/help' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy', href: '/refund' },
  ],
};

const socialLinks = [
  { icon: Instagram, href: 'https://www.instagram.com/easyxdropship/', label: 'Instagram', color: 'hover:text-pink-400' },
  { icon: Twitter, href: 'https://x.com/zenvarunn', label: 'X (Twitter)', color: 'hover:text-blue-400' },
];

const contactInfo = [
  { icon: Mail, label: 'agarwalvarun3169@gmail.com' },
  { icon: Phone, label: '+91 79806 45580' },
  { icon: MapPin, label: 'Mumbai, India' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);
  const isInView = useInView(footerRef, { once: true, amount: 0.1 });

  return (
    <footer ref={footerRef} className="relative bg-black">
      {/* Gradient Top Border */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500 via-blue-500 to-transparent" />
      
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh opacity-20" />
      
      <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12 mb-16">
          {/* Brand Column */}
          <motion.div 
            className="col-span-2 md:col-span-3 lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-xl font-bold text-white hover:text-white/80 transition-colors mb-4"
            >
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse-glow" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 blur-sm opacity-50" />
              </div>
              EAZY DROPSHIPPING
            </Link>
            
            <p className="text-text-secondary text-sm mb-6 max-w-sm leading-relaxed">
              The fastest way to launch your Shopify store. Browse products, 
              connect your account, and get a fully functional store automatically. 
              Trusted by 5000+ entrepreneurs worldwide.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              {contactInfo.map((info) => {
                const Icon = info.icon;
                return (
                  <div key={info.label} className="flex items-center gap-3 text-sm text-text-secondary">
                    <Icon className="w-4 h-4 text-text-muted" />
                    <span>{info.label}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-xl glass-card flex items-center justify-center text-text-secondary ${social.color} transition-all`}
                    aria-label={social.label}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Product Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="group text-text-secondary hover:text-white transition-colors text-sm flex items-center gap-2"
                  >
                    <span className="animated-underline">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="group text-text-secondary hover:text-white transition-colors text-sm flex items-center gap-2"
                  >
                    <span className="animated-underline">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-text-secondary hover:text-white transition-colors text-sm animated-underline inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-text-secondary hover:text-white transition-colors text-sm animated-underline inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="border-t border-white/10 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-text-secondary text-sm">
              © {currentYear} EAZY DROPSHIPPING. All rights reserved.
            </p>
            
            <p className="text-text-secondary text-sm flex items-center gap-2">
              Built with <Heart className="w-4 h-4 text-red-400 fill-red-400" /> in India
              <span className="text-lg">🇮🇳</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Decorative Bottom Gradient */}
      <div className="h-1 bg-gradient-to-r from-purple-500 via-blue-500 via-teal-500 to-pink-500 opacity-50" />
    </footer>
  );
}
