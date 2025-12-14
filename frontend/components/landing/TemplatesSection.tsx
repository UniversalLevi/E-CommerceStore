'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  ArrowRight, 
  Eye, 
  Palette, 
  Sparkles,
  ShoppingBag,
  Heart,
  Star,
  Zap
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  gradient: string;
  accentColor: string;
  features: string[];
  popularity: number;
  isNew?: boolean;
  isPremium?: boolean;
}

const templates: Template[] = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean, professional design with focus on product imagery. Perfect for fashion and lifestyle brands.',
    category: 'Fashion',
    gradient: 'from-purple-500/30 to-blue-500/30',
    accentColor: 'text-purple-400',
    features: ['Responsive Design', 'Quick View', 'Wishlist'],
    popularity: 98,
    isNew: true,
  },
  {
    id: 'bold-commerce',
    name: 'Bold Commerce',
    description: 'Eye-catching layouts with vibrant colors that drive conversions. Ideal for electronics and gadgets.',
    category: 'Electronics',
    gradient: 'from-blue-500/30 to-teal-500/30',
    accentColor: 'text-blue-400',
    features: ['Product Comparison', 'Reviews', 'Quick Add'],
    popularity: 95,
  },
  {
    id: 'elegant-classic',
    name: 'Elegant Classic',
    description: 'Timeless sophistication that never goes out of style. Best for jewelry and luxury items.',
    category: 'Luxury',
    gradient: 'from-teal-500/30 to-purple-500/30',
    accentColor: 'text-teal-400',
    features: ['Image Zoom', 'Size Guide', 'Gift Wrap'],
    popularity: 92,
    isPremium: true,
  },
  {
    id: 'premium-pro',
    name: 'Premium Pro',
    description: 'High-end aesthetic with advanced features for serious sellers. Perfect for multi-category stores.',
    category: 'Multi-Category',
    gradient: 'from-pink-500/30 to-purple-500/30',
    accentColor: 'text-pink-400',
    features: ['Mega Menu', 'Filters', 'Collections'],
    popularity: 97,
    isPremium: true,
  },
  {
    id: 'fresh-organic',
    name: 'Fresh & Organic',
    description: 'Natural, earthy design perfect for health, wellness, and organic product stores.',
    category: 'Health',
    gradient: 'from-green-500/30 to-teal-500/30',
    accentColor: 'text-green-400',
    features: ['Nutrition Info', 'Subscriptions', 'Bundles'],
    popularity: 89,
    isNew: true,
  },
  {
    id: 'urban-street',
    name: 'Urban Street',
    description: 'Edgy, contemporary design for streetwear and urban fashion brands.',
    category: 'Streetwear',
    gradient: 'from-orange-500/30 to-red-500/30',
    accentColor: 'text-orange-400',
    features: ['Lookbook', 'Size Finder', 'Drop Alerts'],
    popularity: 94,
  },
  {
    id: 'artisan-craft',
    name: 'Artisan Craft',
    description: 'Handcrafted feel perfect for artisanal products, handmade goods, and craft supplies.',
    category: 'Handmade',
    gradient: 'from-amber-500/30 to-orange-500/30',
    accentColor: 'text-amber-400',
    features: ['Story Sections', 'Custom Orders', 'Gallery'],
    popularity: 88,
  },
  {
    id: 'tech-future',
    name: 'Tech Future',
    description: 'Futuristic, cutting-edge design for tech products and innovative gadgets.',
    category: 'Technology',
    gradient: 'from-cyan-500/30 to-blue-500/30',
    accentColor: 'text-cyan-400',
    features: ['3D Preview', 'Specs Table', 'Compare'],
    popularity: 96,
    isPremium: true,
  },
];

const categories = ['All', 'Fashion', 'Electronics', 'Luxury', 'Health', 'Streetwear', 'Handmade', 'Technology'];

export default function TemplatesSection() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const filteredTemplates = activeCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === activeCategory);

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
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.span 
            className="inline-block px-4 py-1.5 rounded-full glass-card text-sm text-teal-400 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <Palette className="w-4 h-4 inline mr-2" />
            Professional Themes
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-gradient-teal">Beautiful Store Templates</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            Choose from our collection of professionally designed, conversion-optimized themes. 
            Each template is fully customizable to match your brand.
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <motion.button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'glass-card text-text-secondary hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Templates Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                variants={itemVariants}
                layout
                className="group glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-500"
                onMouseEnter={() => setHoveredTemplate(template.id)}
                onMouseLeave={() => setHoveredTemplate(null)}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                {/* Template Preview Area */}
                <div className={`relative h-52 bg-gradient-to-br ${template.gradient} overflow-hidden`}>
                  {/* Mock Store Preview */}
                  <div className="absolute inset-4 glass-card rounded-lg p-3 opacity-80">
                    {/* Mini Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-16 h-2 bg-white/30 rounded" />
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded bg-white/20" />
                        <div className="w-4 h-4 rounded bg-white/20" />
                      </div>
                    </div>
                    {/* Mini Products */}
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-square rounded bg-white/10" />
                      ))}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {template.isNew && (
                      <span className="px-2 py-1 bg-green-500 rounded-full text-xs font-bold text-white flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> New
                      </span>
                    )}
                    {template.isPremium && (
                      <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-xs font-bold text-white flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Pro
                      </span>
                    )}
                  </div>

                  {/* Popularity Badge */}
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center gap-1 px-2 py-1 bg-black/50 rounded-full">
                      <Heart className="w-3 h-3 text-pink-400" />
                      <span className="text-xs text-white">{template.popularity}%</span>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <motion.div 
                    className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredTemplate === template.id ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link href="/dashboard/templates">
                      <motion.button
                        className="px-4 py-2 bg-white text-black rounded-lg font-semibold text-sm flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Eye className="w-4 h-4" /> Preview
                      </motion.button>
                    </Link>
                    <Link href="/dashboard/templates">
                      <motion.button
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Use This
                      </motion.button>
                    </Link>
                  </motion.div>

                  {/* Bottom Gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                
                {/* Template Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className={`text-lg font-bold text-white group-hover:${template.accentColor} transition-colors`}>
                        {template.name}
                      </h3>
                      <span className="text-xs text-text-muted">{template.category}</span>
                    </div>
                    <Store className={`w-5 h-5 ${template.accentColor}`} />
                  </div>
                  
                  <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Features Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.features.map((feature) => (
                      <span 
                        key={feature}
                        className="px-2 py-1 bg-white/5 rounded text-xs text-text-muted"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  <Link href="/dashboard/templates">
                    <motion.button 
                      className={`${template.accentColor} hover:text-white font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all`}
                      whileHover={{ x: 4 }}
                    >
                      View Template <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* View All Templates CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-12"
        >
          <Link href="/dashboard/templates">
            <motion.button
              className="group inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/40 rounded-full font-semibold text-white transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingBag className="w-5 h-5" />
              View All Templates
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
          <p className="text-text-muted text-sm mt-4">
            50+ templates available • New templates added weekly
          </p>
        </motion.div>

        {/* Template Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                { value: '50+', label: 'Templates', icon: Palette },
                { value: '4.9', label: 'Avg. Rating', icon: Star },
                { value: '10K+', label: 'Active Stores', icon: Store },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Icon className="w-5 h-5 text-text-muted" />
                      <span className="text-2xl md:text-3xl font-bold text-white">{stat.value}</span>
                    </div>
                    <span className="text-sm text-text-secondary">{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
