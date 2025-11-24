'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer: 'Click on "Sign Up" in the top right corner, enter your email and password, and you\'re ready to go! No credit card required.',
  },
  {
    category: 'Getting Started',
    question: 'How do I connect my Shopify store?',
    answer: 'Go to Dashboard > Stores > Connect Store. Enter your store name, shop domain (e.g., mystore.myshopify.com), and access token. You can find your access token in your Shopify admin under Apps > Private apps.',
  },
  {
    category: 'Getting Started',
    question: 'What is an access token?',
    answer: 'An access token is a secure credential that allows our service to access your Shopify store. You can create one in your Shopify admin under Settings > Apps and sales channels > Develop apps > Create an app.',
  },
  {
    category: 'Store Setup',
    question: 'How do I add products to my store?',
    answer: 'Browse our product catalog, select a niche, choose products you like, and click "Add to Store". Select which store to add it to, and the product will be automatically added to your Shopify store.',
  },
  {
    category: 'Store Setup',
    question: 'Can I add products to multiple stores?',
    answer: 'Yes! You can connect multiple Shopify stores and add products to any of them. Each store connection is independent.',
  },
  {
    category: 'Store Setup',
    question: 'What happens after I add a product?',
    answer: 'The product is automatically created in your Shopify store with all the details, images, and pricing. You can then manage it directly in your Shopify admin panel.',
  },
  {
    category: 'Products',
    question: 'Can I edit products after adding them?',
    answer: 'Yes! Once a product is added to your Shopify store, you can edit it directly in your Shopify admin panel. Changes made there will be reflected in your store.',
  },
  {
    category: 'Products',
    question: 'How do I remove a product from my store?',
    answer: 'You can delete products directly from your Shopify admin panel. Go to Products > select the product > Delete.',
  },
  {
    category: 'Products',
    question: 'What are niches?',
    answer: 'Niches are product categories that help organize our product catalog. Browse niches to find products that match your store\'s theme, such as Fitness, Home & Garden, Electronics, etc.',
  },
  {
    category: 'Troubleshooting',
    question: 'I can\'t connect my store. What should I do?',
    answer: 'Make sure your access token has the correct permissions (read_products, write_products, read_themes, write_themes). Also verify that your shop domain is correct (should end with .myshopify.com).',
  },
  {
    category: 'Troubleshooting',
    question: 'My store connection test failed. Why?',
    answer: 'This usually means your access token is invalid or expired. Generate a new access token in your Shopify admin and update your store connection.',
  },
  {
    category: 'Troubleshooting',
    question: 'Products aren\'t appearing in my store. What\'s wrong?',
    answer: 'First, check that your store connection is active. Then verify that the product was successfully added by checking your Shopify admin. If issues persist, try testing your store connection again.',
  },
  {
    category: 'Account',
    question: 'How do I change my password?',
    answer: 'Go to Settings > Change Password. Enter your current password and your new password, then save.',
  },
  {
    category: 'Account',
    question: 'Can I delete my account?',
    answer: 'Yes, you can delete your account from Settings > Delete Account. This will remove your account but products already added to your Shopify stores will remain.',
  },
  {
    category: 'Account',
    question: 'I forgot my password. How do I reset it?',
    answer: 'Click "Forgot password?" on the login page, enter your email, and we\'ll send you a reset link. The link expires in 1 hour.',
  },
];

const categories = ['All', ...Array.from(new Set(faqs.map((faq) => faq.category)))];

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl bg-black min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Help & Support</h1>
        <p className="text-xl text-[#a0a0a0]">
            Find answers to common questions and learn how to get the most out of our platform
          </p>
        </div>

      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-2xl mx-auto block px-4 py-3 bg-[#1a1a1a] border border-[#505050] text-white rounded-lg focus:ring-2 focus:ring-[#808080] focus:border-[#808080]"
        />
      </div>

      {/* Category Filter */}
      <div className="mb-8 flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === category
                ? 'bg-white text-black'
                : 'bg-[#1a1a1a] text-[#a0a0a0] border border-[#505050] hover:bg-[#2a2a2a]'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="bg-[#1a1a1a] border border-[#505050] rounded-xl shadow-md p-8 mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
        {filteredFAQs.length === 0 ? (
          <p className="text-[#a0a0a0] text-center py-8">
            No FAQs found matching your search. Try a different query or category.
          </p>
        ) : (
          filteredFAQs.map((faq, index) => (
            <div
              key={index}
              className="border border-[#505050] rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#2a2a2a] transition-colors"
              >
                <div className="flex-1">
                  <div className="text-sm text-[#808080] font-medium mb-1">
                    {faq.category}
                  </div>
                  <h3 className="font-semibold text-white">{faq.question}</h3>
                </div>
                <svg
                  className={`w-5 h-5 text-[#808080] transition-transform ${
                    expandedFAQ === index ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {expandedFAQ === index && (
                <div className="px-6 py-4 bg-[#2a2a2a] border-t border-[#505050]">
                  <p className="text-[#a0a0a0] leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))
        )}
          </div>
      </div>

      {/* Tutorials Section */}
      <div className="bg-[#1a1a1a] border border-[#505050] rounded-xl shadow-md p-8 mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Video Tutorials</h2>
        <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-[#505050] rounded-lg p-6">
              <h3 className="font-semibold text-white mb-2">Getting Started</h3>
              <p className="text-[#a0a0a0] mb-4">
                Learn how to create an account, connect your first store, and add your first product.
              </p>
              <div className="aspect-video bg-[#0a0a0a] border border-[#505050] rounded-lg flex items-center justify-center">
                <span className="text-[#808080]">Video Coming Soon</span>
              </div>
            </div>
            <div className="border border-[#505050] rounded-lg p-6">
              <h3 className="font-semibold text-white mb-2">Store Connection</h3>
              <p className="text-[#a0a0a0] mb-4">
                Step-by-step guide to connecting your Shopify store and generating access tokens.
              </p>
              <div className="aspect-video bg-[#0a0a0a] border border-[#505050] rounded-lg flex items-center justify-center">
                <span className="text-[#808080]">Video Coming Soon</span>
              </div>
            </div>
            <div className="border border-[#505050] rounded-lg p-6">
              <h3 className="font-semibold text-white mb-2">Adding Products</h3>
              <p className="text-[#a0a0a0] mb-4">
                Discover how to browse niches, select products, and add them to your store.
              </p>
              <div className="aspect-video bg-[#0a0a0a] border border-[#505050] rounded-lg flex items-center justify-center">
                <span className="text-[#808080]">Video Coming Soon</span>
              </div>
            </div>
            <div className="border border-[#505050] rounded-lg p-6">
              <h3 className="font-semibold text-white mb-2">Managing Multiple Stores</h3>
              <p className="text-[#a0a0a0] mb-4">
                Learn how to connect and manage multiple Shopify stores from one account.
              </p>
              <div className="aspect-video bg-[#0a0a0a] border border-[#505050] rounded-lg flex items-center justify-center">
                <span className="text-[#808080]">Video Coming Soon</span>
              </div>
            </div>
          </div>
      </div>

      {/* Contact Support */}
      <div className="bg-[#1a1a1a] border border-[#808080] rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
        <p className="text-[#a0a0a0] mb-6">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <Link
          href="/contact"
          className="inline-block bg-white hover:bg-[#e0e0e0] text-black px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Contact Support
        </Link>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="text-white hover:text-[#e0e0e0] font-medium"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

