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
    question: 'How do I connect my Shopify store?',
    answer: 'Go to Dashboard > Stores > Connect Store. Enter your store name, shop domain (e.g., mystore.myshopify.com), and access token. You can find your access token in your Shopify admin under Apps > Private apps.',
  },
  {
    category: 'Getting Started',
    question: 'What is an access token?',
    answer: 'An access token is a secure credential that allows our service to access your Shopify store. You can create one in your Shopify admin under Settings > Apps and sales channels > Develop apps > Create an app. Make sure it has read_products, write_products, read_themes, and write_themes permissions.',
  },
  {
    category: 'Store Setup',
    question: 'How do I add products to my store?',
    answer: 'Go to Dashboard > Products, browse our product catalog, select a niche, choose products you like, and click "Add to Store". Select which store to add it to, and the product will be automatically added to your Shopify store.',
  },
  {
    category: 'Store Setup',
    question: 'Can I add products to multiple stores?',
    answer: 'Yes! You can connect multiple Shopify stores and add products to any of them. Each store connection is independent. When adding a product, you\'ll be prompted to select which store(s) to add it to.',
  },
  {
    category: 'Store Setup',
    question: 'What happens after I add a product?',
    answer: 'The product is automatically created in your Shopify store with all the details, images, and pricing. You can then manage it directly in your Shopify admin panel. The product will appear in your store\'s product catalog.',
  },
  {
    category: 'Store Management',
    question: 'How do I test my store connection?',
    answer: 'Go to Dashboard > Stores, find your store, and click the "Test" button. This will verify that your access token is valid and your store is accessible. You should test your connection regularly to ensure it\'s working properly.',
  },
  {
    category: 'Store Management',
    question: 'What does "Invalid" store status mean?',
    answer: 'An "Invalid" status means your store connection is not working. This usually happens when your access token has expired or been revoked. Generate a new access token in your Shopify admin and update your store connection.',
  },
  {
    category: 'Store Management',
    question: 'How do I set a default store?',
    answer: 'Go to Dashboard > Stores, find the store you want to set as default, and click "Set as Default". This store will be pre-selected when adding products, making it faster to add products to your primary store.',
  },
  {
    category: 'Products',
    question: 'Can I edit products after adding them?',
    answer: 'Yes! Once a product is added to your Shopify store, you can edit it directly in your Shopify admin panel. Changes made there will be reflected in your store. You can also view products you\'ve added in Dashboard > Products.',
  },
  {
    category: 'Products',
    question: 'How do I remove a product from my store?',
    answer: 'You can delete products directly from your Shopify admin panel. Go to Products > select the product > Delete. Products removed from Shopify will no longer appear in your store.',
  },
  {
    category: 'Products',
    question: 'What are niches?',
    answer: 'Niches are product categories that help organize our product catalog. Browse niches to find products that match your store\'s theme, such as Fitness, Home & Garden, Electronics, etc. You can filter products by niche in the Products page.',
  },
  {
    category: 'Account & Billing',
    question: 'How do I view my subscription status?',
    answer: 'Go to Dashboard > Billing to view your current subscription plan, billing history, and manage your subscription. You can upgrade, downgrade, or cancel your subscription from this page.',
  },
  {
    category: 'Account & Billing',
    question: 'How do I change my password?',
    answer: 'Go to Settings > Change Password. Enter your current password and your new password, then save. Make sure your new password is strong and secure.',
  },
  {
    category: 'Account & Billing',
    question: 'What happens if I exceed my product limit?',
    answer: 'If you exceed your product limit, you\'ll see a warning message. You can upgrade your plan to increase your limit, or remove some products from your stores. Check your current usage in Dashboard > Billing.',
  },
  {
    category: 'Troubleshooting',
    question: 'I can\'t connect my store. What should I do?',
    answer: 'Make sure your access token has the correct permissions (read_products, write_products, read_themes, write_themes). Also verify that your shop domain is correct (should end with .myshopify.com). If issues persist, try generating a new access token.',
  },
  {
    category: 'Troubleshooting',
    question: 'My store connection test failed. Why?',
    answer: 'This usually means your access token is invalid or expired. Generate a new access token in your Shopify admin and update your store connection. Also check that your store is not in maintenance mode.',
  },
  {
    category: 'Troubleshooting',
    question: 'Products aren\'t appearing in my store. What\'s wrong?',
    answer: 'First, check that your store connection is active by testing it. Then verify that the product was successfully added by checking your Shopify admin. If issues persist, try testing your store connection again and ensure your access token has write_products permission.',
  },
  {
    category: 'Troubleshooting',
    question: 'I see an error when adding products. What should I do?',
    answer: 'Check that your store connection is active and your access token has write_products permission. Also verify you haven\'t exceeded your product limit. If the error persists, try testing your store connection and contact support if needed.',
  },
  {
    category: 'Analytics',
    question: 'What analytics are available?',
    answer: 'Go to Dashboard > Analytics to view statistics about your stores, products added, and activity. This helps you track your progress and understand how you\'re using the platform.',
  },
  {
    category: 'Analytics',
    question: 'How do I view my activity history?',
    answer: 'Go to Dashboard > Activity to see a log of all your actions, including store connections, product additions, and other activities. This helps you track what you\'ve done on the platform.',
  },
];

const categories = ['All', ...Array.from(new Set(faqs.map((faq) => faq.category)))];

export default function DashboardHelpPage() {
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Help & Support</h1>
        <p className="text-lg text-text-secondary">
          Find answers to common questions and learn how to get the most out of your dashboard
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-2xl px-4 py-3 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === category
                ? 'bg-primary-500 text-black font-semibold'
                : 'bg-surface-raised text-text-secondary border border-border-default hover:bg-surface-hover'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">
                No FAQs found matching your search. Try a different query or category.
              </p>
            </div>
          ) : (
            filteredFAQs.map((faq, index) => (
              <div
                key={index}
                className="border border-border-default rounded-lg overflow-hidden hover:border-border-muted transition-colors"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-surface-hover transition-colors"
                >
                  <div className="flex-1">
                    <div className="text-xs text-text-muted font-medium mb-1 uppercase tracking-wide">
                      {faq.category}
                    </div>
                    <h3 className="font-semibold text-text-primary">{faq.question}</h3>
                  </div>
                  <svg
                    className={`w-5 h-5 text-text-muted transition-transform flex-shrink-0 ml-4 ${
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
                  <div className="px-6 py-4 bg-surface-hover border-t border-border-default">
                    <p className="text-text-secondary leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Quick Links</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/dashboard/stores/connect"
            className="bg-surface-elevated border border-border-default rounded-lg p-4 hover:border-primary-500 hover:bg-surface-hover transition-all"
          >
            <h3 className="font-semibold text-text-primary mb-2">Connect a Store</h3>
            <p className="text-sm text-text-secondary">
              Set up your first Shopify store connection
            </p>
          </Link>
          <Link
            href="/dashboard/products"
            className="bg-surface-elevated border border-border-default rounded-lg p-4 hover:border-primary-500 hover:bg-surface-hover transition-all"
          >
            <h3 className="font-semibold text-text-primary mb-2">Browse Products</h3>
            <p className="text-sm text-text-secondary">
              Explore our product catalog and add products to your store
            </p>
          </Link>
          <Link
            href="/dashboard/stores"
            className="bg-surface-elevated border border-border-default rounded-lg p-4 hover:border-primary-500 hover:bg-surface-hover transition-all"
          >
            <h3 className="font-semibold text-text-primary mb-2">Manage Stores</h3>
            <p className="text-sm text-text-secondary">
              View and manage all your connected Shopify stores
            </p>
          </Link>
          <Link
            href="/dashboard/billing"
            className="bg-surface-elevated border border-border-default rounded-lg p-4 hover:border-primary-500 hover:bg-surface-hover transition-all"
          >
            <h3 className="font-semibold text-text-primary mb-2">Billing & Subscription</h3>
            <p className="text-sm text-text-secondary">
              Manage your subscription and view billing history
            </p>
          </Link>
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-surface-raised border border-primary-500 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Still Need Help?</h2>
        <p className="text-text-secondary mb-6">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <Link
          href="/contact"
          className="inline-block bg-primary-500 hover:bg-primary-400 text-black px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}

