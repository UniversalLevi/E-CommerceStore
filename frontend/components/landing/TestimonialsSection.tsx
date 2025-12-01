'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight, Play, Verified } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  text: string;
  fullText: string;
  rating: number;
  gradient: string;
  avatar: string;
  revenue?: string;
  stores?: number;
  isVerified?: boolean;
  hasVideo?: boolean;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Founder',
    company: 'StyleBox India',
    location: 'Mumbai, India',
    text: 'Set up my store in 5 minutes. The product catalog is amazing and everything just works!',
    fullText: 'I was skeptical at first, but this platform exceeded all my expectations. Set up my store in 5 minutes. The product catalog is amazing and everything just works! My revenue grew 300% in the first month. The support team is incredibly responsive and helpful.',
    rating: 5,
    gradient: 'from-purple-500 to-purple-600',
    avatar: 'SC',
    revenue: '₹12L+',
    stores: 2,
    isVerified: true,
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    role: 'CEO',
    company: 'TechGadgets Pro',
    location: 'Bangalore, India',
    text: 'Best investment I\'ve made. Multiple stores, zero hassle. The automation is incredible.',
    fullText: 'Best investment I\'ve made for my e-commerce business. Managing multiple stores used to be a nightmare, but now it\'s zero hassle. The automation is incredible - from inventory sync to order management. Highly recommend to anyone serious about scaling.',
    rating: 5,
    gradient: 'from-blue-500 to-blue-600',
    avatar: 'MR',
    revenue: '₹25L+',
    stores: 5,
    isVerified: true,
    hasVideo: true,
  },
  {
    id: '3',
    name: 'Emma Thompson',
    role: 'Owner',
    company: 'Artisan Crafts',
    location: 'Delhi, India',
    text: 'No technical skills needed. I had a professional store running the same day I signed up.',
    fullText: 'As someone with zero technical background, I was worried about setting up an online store. No technical skills needed here! I had a professional store running the same day I signed up. The templates are gorgeous and my customers love the shopping experience.',
    rating: 5,
    gradient: 'from-teal-500 to-teal-600',
    avatar: 'ET',
    revenue: '₹8L+',
    stores: 1,
    isVerified: true,
  },
  {
    id: '4',
    name: 'Raj Patel',
    role: 'Director',
    company: 'HomeStyle Living',
    location: 'Ahmedabad, India',
    text: 'The AI-powered product descriptions saved me hours. Quality is outstanding.',
    fullText: 'The AI-powered product descriptions feature alone saved me countless hours of work. The quality is outstanding - my conversion rate improved by 40% after switching to this platform. The analytics dashboard gives me insights I never had before.',
    rating: 5,
    gradient: 'from-pink-500 to-pink-600',
    avatar: 'RP',
    revenue: '₹18L+',
    stores: 3,
    isVerified: true,
  },
  {
    id: '5',
    name: 'Priya Sharma',
    role: 'Entrepreneur',
    company: 'Fashion Forward',
    location: 'Pune, India',
    text: 'From zero to ₹5L monthly revenue in just 3 months. This platform is a game-changer.',
    fullText: 'From zero to ₹5L monthly revenue in just 3 months. This platform is an absolute game-changer for anyone wanting to start an e-commerce business. The product selection is excellent and the one-click import feature is magical.',
    rating: 5,
    gradient: 'from-orange-500 to-orange-600',
    avatar: 'PS',
    revenue: '₹15L+',
    stores: 2,
    isVerified: true,
    hasVideo: true,
  },
  {
    id: '6',
    name: 'Arjun Mehta',
    role: 'Co-founder',
    company: 'GreenLife Organics',
    location: 'Chennai, India',
    text: 'Customer support is exceptional. They helped me optimize my store for better conversions.',
    fullText: 'What sets this platform apart is the exceptional customer support. They didn\'t just help me set up - they helped me optimize my store for better conversions. My bounce rate dropped by 50% after implementing their suggestions.',
    rating: 5,
    gradient: 'from-green-500 to-green-600',
    avatar: 'AM',
    revenue: '₹10L+',
    stores: 1,
    isVerified: true,
  },
];

const stats = [
  { value: '4.9/5', label: 'Average Rating' },
  { value: '5000+', label: 'Happy Merchants' },
  { value: '₹50L+', label: 'Revenue Generated' },
];

export default function TestimonialsSection() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate testimonials
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const activeTestimonial = testimonials[activeIndex];

  return (
    <section 
      ref={containerRef}
      className="py-24 md:py-32 bg-black relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
      
      {/* Animated Background */}
      <motion.div 
        className="absolute top-1/3 -left-32 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"
        animate={{ x: [0, 30, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-1/3 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        animate={{ x: [0, -30, 0], opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 8, repeat: Infinity }}
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
            className="inline-block px-4 py-1.5 rounded-full glass-card text-sm text-pink-400 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <Star className="w-4 h-4 inline mr-2 fill-yellow-400 text-yellow-400" />
            Customer Stories
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-gradient-pink">Loved by Store Owners</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Join thousands of successful entrepreneurs who have transformed their 
            e-commerce dreams into thriving businesses.
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-8 md:gap-16 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-text-secondary">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Featured Testimonial */}
        <div className="max-w-4xl mx-auto mb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTestimonial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="glass-card rounded-3xl p-8 md:p-12 border border-white/10 relative overflow-hidden"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 w-16 h-16 text-white/5" />
              
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar & Info */}
                <div className="flex-shrink-0">
                  <motion.div 
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${activeTestimonial.gradient} flex items-center justify-center text-white font-bold text-2xl shadow-xl`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {activeTestimonial.avatar}
                  </motion.div>
                  {activeTestimonial.hasVideo && (
                    <motion.button
                      className="mt-3 flex items-center gap-1 text-xs text-text-secondary hover:text-white transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Play className="w-3 h-3" /> Watch Story
                    </motion.button>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(activeTestimonial.rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <p className="text-lg md:text-xl text-white/90 mb-6 leading-relaxed">
                    "{activeTestimonial.fullText}"
                  </p>
                  
                  {/* Author Info */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {activeTestimonial.name}
                        </span>
                        {activeTestimonial.isVerified && (
                          <Verified className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {activeTestimonial.role} at {activeTestimonial.company}
                      </div>
                      <div className="text-xs text-text-muted">
                        {activeTestimonial.location}
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex gap-4 ml-auto">
                      {activeTestimonial.revenue && (
                        <div className="text-center px-4 py-2 bg-white/5 rounded-lg">
                          <div className="text-lg font-bold text-green-400">{activeTestimonial.revenue}</div>
                          <div className="text-xs text-text-muted">Revenue</div>
                        </div>
                      )}
                      {activeTestimonial.stores && (
                        <div className="text-center px-4 py-2 bg-white/5 rounded-lg">
                          <div className="text-lg font-bold text-purple-400">{activeTestimonial.stores}</div>
                          <div className="text-xs text-text-muted">Stores</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <motion.button
              onClick={handlePrev}
              className="p-3 rounded-full glass-card hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>
            
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setActiveIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === activeIndex 
                      ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>
            
            <motion.button
              onClick={handleNext}
              className="p-3 rounded-full glass-card hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>

        {/* Testimonials Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              className={`glass-card rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all cursor-pointer ${
                activeIndex === index ? 'ring-2 ring-purple-500/50' : ''
              }`}
              onClick={() => {
                setIsAutoPlaying(false);
                setActiveIndex(index);
              }}
              whileHover={{ y: -4, scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              {/* Rating */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              {/* Quote */}
              <p className="text-text-secondary/90 mb-4 leading-relaxed text-sm line-clamp-3">
                "{testimonial.text}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-white text-sm">{testimonial.name}</span>
                    {testimonial.isVerified && <Verified className="w-3 h-3 text-blue-400" />}
                  </div>
                  <div className="text-xs text-text-muted">{testimonial.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-text-secondary mb-4">
            Ready to write your success story?
          </p>
          <motion.button
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-purple-500/25"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Your Journey Today
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
