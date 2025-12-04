'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import {
  CheckCircle,
  Store,
  ShoppingBag,
  Package,
  Wallet,
  CreditCard,
  Truck,
  FileText,
  ArrowRight,
  Circle,
} from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Create Your Store',
    description: 'Connect your Shopify store or create a new one to start selling products.',
    icon: Store,
    details: [
      'Go to Dashboard → Stores',
      'Click "Connect Store" or "Create New Store"',
      'Enter your Shopify store URL and access token',
      'Verify the connection and sync your products',
    ],
    link: '/dashboard/stores',
  },
  {
    id: 2,
    title: 'Add Products',
    description: 'Browse and add products from our catalog to your store.',
    icon: ShoppingBag,
    details: [
      'Navigate to Products section',
      'Browse products by niche or category',
      'Click "Add to Store" on products you want',
      'Products will automatically sync to your Shopify store',
    ],
    link: '/dashboard/products',
  },
  {
    id: 3,
    title: 'Understand Product Pricing',
    description: 'See how product pricing is structured for your imported products.',
    icon: CreditCard,
    details: [
      'Each product has a Base Price (cost price), Profit margin, and Shipping Price',
      'The final price is calculated as: Base Price + Profit + Shipping',
      'These prices are managed by the ZEN/EAZY team for you',
      'You can still adjust final prices inside your Shopify admin if needed',
      'Multiple product images are used to improve your conversion rate',
    ],
    link: '/dashboard/products',
  },
  {
    id: 4,
    title: 'Top Up Your Wallet',
    description: 'Add funds to your wallet to fulfill orders via ZEN.',
    icon: Wallet,
    details: [
      'Go to Dashboard → Wallet',
      'Click "Add Money" button',
      'Enter the amount (minimum ₹100)',
      'Complete payment via Razorpay',
      'Funds will be credited instantly',
    ],
    link: '/dashboard/wallet',
  },
  {
    id: 5,
    title: 'Fulfill Orders via ZEN',
    description: 'When you receive an order, fulfill it using the ZEN system.',
    icon: Package,
    details: [
      'Go to Dashboard → Orders',
      'Find the order you want to fulfill',
      'Click "Fulfill via ZEN" button',
      'The system will automatically deduct the product cost from your wallet',
      'If insufficient balance, you\'ll be prompted to top up',
    ],
    link: '/dashboard/orders',
  },
  {
    id: 6,
    title: 'Track Order Status',
    description: 'Monitor your ZEN orders through the fulfillment pipeline.',
    icon: Truck,
    details: [
      'View order status in Dashboard → Orders',
      'Status updates: Pending → Sourcing → Packing → Dispatched → Shipped → Delivered',
      'You will see when an order is marked as RTO (Return to Origin) in your orders list',
      'Track shipments using tracking numbers provided in your store / order details',
    ],
    link: '/dashboard/orders',
  },
  {
    id: 7,
    title: 'How RTO Orders Are Handled',
    description: 'Learn what happens when an order is returned to origin (RTO).',
    icon: FileText,
    details: [
      'If a shipment cannot be delivered, it may be marked as RTO by the courier',
      'You will see the RTO status in your order timeline in Dashboard → Orders',
      'Our operations/admin team manages the detailed RTO handling and return address setup',
      'You just need to monitor the status and communicate with your customer if needed',
      'For any RTO issues, contact support from the Help section in your dashboard',
    ],
    link: '/dashboard/orders',
  },
];

export default function GuidePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Step-by-Step Guide
          </h1>
          <p className="text-lg text-text-secondary">
            Follow these steps to get started with your dropshipping business
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="relative">
                {/* Connection Line */}
                {!isLast && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border-default" />
                )}

                <div className="bg-surface-raised border border-border-default rounded-xl p-6 hover:border-primary-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Step Number & Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary-500/20 border-2 border-primary-500 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary-500" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-text-primary mb-1">
                            Step {step.id}: {step.title}
                          </h3>
                          <p className="text-text-secondary mb-4">{step.description}</p>
                        </div>
                        {step.link && (
                          <a
                            href={step.link}
                            className="flex-shrink-0 px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            Go to Page
                            <ArrowRight className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      {/* Details List */}
                      <div className="bg-surface-elevated rounded-lg p-4 space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-text-secondary">{detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Tips */}
        <div className="mt-12 bg-gradient-to-r from-primary-500/10 to-blue-500/10 border border-primary-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Circle className="w-6 h-6 text-primary-500 fill-primary-500" />
            Pro Tips
          </h2>
          <ul className="space-y-2 text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-primary-500">•</span>
              <span>Keep your wallet topped up to avoid delays in order fulfillment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500">•</span>
              <span>Set competitive profit margins while maintaining good customer value</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500">•</span>
              <span>Monitor your ZEN orders regularly to track fulfillment status</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500">•</span>
              <span>Add multiple product images to increase conversion rates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500">•</span>
              <span>For RTO orders, always provide accurate return addresses</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

