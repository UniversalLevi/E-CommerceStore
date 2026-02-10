'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  Plus, 
  Minus, 
  MessageCircle,
  Mail,
  Phone
} from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How quickly can I set up my store?',
    answer: 'Most users have their store up and running in under 5 minutes! Simply connect your Shopify account, browse our product catalog, and add products with one click. Our system automatically handles product descriptions, images, and pricing.',
    category: 'Getting Started',
  },
  {
    id: '2',
    question: 'Do I need any technical skills?',
    answer: 'Absolutely not! Our platform is designed for everyone, regardless of technical background. We handle all the complex stuff - from product imports to inventory management. You just focus on growing your business.',
    category: 'Getting Started',
  },
  {
    id: '3',
    question: 'How does the product catalog work?',
    answer: 'We maintain a curated catalog of over 1000+ winning products across various niches. Each product comes with professional images, optimized descriptions, and suggested pricing. You can browse by category, filter by profit margin, or search for specific items.',
    category: 'Products',
  },
  {
    id: '4',
    question: 'Can I connect multiple Shopify stores?',
    answer: 'Yes! Depending on your subscription plan, you can connect and manage multiple Shopify stores from a single dashboard. This is perfect for entrepreneurs running multiple brands or testing different niches.',
    category: 'Features',
  },
  {
    id: '5',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major payment methods including credit/debit cards (Visa, Mastercard, Amex), UPI, net banking, and popular wallets. All payments are processed securely through Razorpay with 256-bit encryption.',
    category: 'Billing',
  },
  {
    id: '6',
    question: 'Is there a free trial available?',
    answer: 'Yes! We offer a free tier that lets you explore the platform and add a limited number of products to your store. This way, you can experience the value before committing to a paid plan.',
    category: 'Billing',
  },
  {
    id: '7',
    question: 'How do I get support if I need help?',
    answer: 'We offer 24/7 customer support through multiple channels - live chat, email, and phone. Our average response time is under 2 hours. Premium plan users get priority support with dedicated account managers.',
    category: 'Support',
  },
  {
    id: '8',
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time with no questions asked. Your access will continue until the end of your billing period. We also offer a 30-day money-back guarantee for new subscribers.',
    category: 'Billing',
  },
  {
    id: '9',
    question: 'Are the product descriptions SEO-optimized?',
    answer: 'Absolutely! All product descriptions are crafted with SEO best practices in mind. Our AI-powered system generates unique, keyword-rich descriptions that help your products rank better in search results.',
    category: 'Products',
  },
  {
    id: '10',
    question: 'How secure is my data?',
    answer: 'Security is our top priority. We use bank-grade 256-bit SSL encryption, are SOC 2 Type II certified, and comply with GDPR regulations. Your Shopify credentials are encrypted and we never store sensitive payment information.',
    category: 'Security',
  },
];

const categories = ['All', 'Getting Started', 'Products', 'Features', 'Billing', 'Support', 'Security'];

export default function FAQSection() {
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  const [activeCategory, setActiveCategory] = useState('All');
  const [openFAQ, setOpenFAQ] = useState<string | null>('1');

  const filteredFAQs = activeCategory === 'All' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <section 
      ref={containerRef}
      className="py-24 md:py-32 bg-black relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.span 
            className="inline-block px-4 py-1.5 rounded-full glass-card text-sm text-purple-400 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <HelpCircle className="w-4 h-4 inline mr-2" />
            Got Questions?
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-gradient-purple">Frequently Asked Questions</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Everything you need to know about our platform. 
            Can't find what you're looking for? Reach out to our support team.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
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
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <AnimatePresence mode="popLayout">
            {filteredFAQs.map((faq, index) => (
              <motion.div
                key={faq.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="mb-4"
              >
                <motion.button
                  onClick={() => toggleFAQ(faq.id)}
                  className={`w-full glass-card rounded-xl p-5 text-left transition-all ${
                    openFAQ === faq.id 
                      ? 'border border-purple-500/30 bg-white/5' 
                      : 'border border-white/10 hover:border-white/20'
                  }`}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-xs text-purple-400 font-medium mb-1 block">
                        {faq.category}
                      </span>
                      <h3 className="text-lg font-semibold text-white">
                        {faq.question}
                      </h3>
                    </div>
                    <motion.div
                      animate={{ rotate: openFAQ === faq.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                    >
                      {openFAQ === faq.id ? (
                        <Minus className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Plus className="w-4 h-4 text-text-secondary" />
                      )}
                    </motion.div>
                  </div>
                  
                  <AnimatePresence>
                    {openFAQ === faq.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="text-text-secondary mt-4 leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Contact Options */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-8 md:p-10 text-center border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-3">
              Still have questions?
            </h3>
            <p className="text-text-secondary mb-8">
              Our support team is here to help you 24/7. Choose your preferred way to reach us.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: MessageCircle, label: 'Live Chat', desc: 'Chat with us now', color: 'from-purple-600 to-blue-600' },
                { icon: Mail, label: 'Email Us', desc: 'support@eazyds.com', color: 'from-blue-600 to-teal-600' },
                { icon: Phone, label: 'Call Us', desc: '+91 800-123-4567', color: 'from-teal-600 to-green-600' },
              ].map((contact) => {
                const Icon = contact.icon;
                return (
                  <Link key={contact.label} href="/contact">
                    <motion.button
                      className="group p-5 glass-card rounded-xl border border-white/10 hover:border-white/20 transition-all text-left w-full"
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${contact.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-white mb-1">{contact.label}</h4>
                      <p className="text-sm text-text-secondary">{contact.desc}</p>
                    </motion.button>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

