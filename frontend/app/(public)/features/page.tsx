'use client';

import Link from 'next/link';
import IconBadge, { IconBadgeVariant } from '@/components/IconBadge';
import type { LucideIcon } from 'lucide-react';
import {
  Link2,
  Tags,
  MousePointerClick,
  Building2,
  Layers as LayersIcon,
  Sparkles,
  ShieldCheck,
  RefreshCcw,
  ShoppingBag,
  Store,
  BarChart3,
  Target,
  CheckCircle2,
} from 'lucide-react';

type FeatureCard = { title: string; description: string; icon: LucideIcon; variant?: IconBadgeVariant };

const detailedFeatures: FeatureCard[] = [
  {
    title: 'Easy Store Connection',
    description: 'Connect your Shopify store in minutes with just your access token. No complex setup required. Our intuitive interface guides you through the process step by step.',
    icon: Link2,
    variant: 'primary',
  },
  {
    title: 'Curated Product Catalog',
    description: 'Browse thousands of products organized by niches. Find exactly what you need for your store. Each product is carefully selected and optimized for e-commerce success.',
    icon: Tags,
  },
  {
    title: 'One-Click Product Addition',
    description: 'Add products to your Shopify store with a single click. All details, images, and pricing included. No manual data entry required.',
    icon: MousePointerClick,
    variant: 'success',
  },
  {
    title: 'Multiple Store Management',
    description: 'Manage multiple Shopify stores from one account. Switch between stores effortlessly. Perfect for agencies and entrepreneurs managing multiple brands.',
    icon: Building2,
  },
  {
    title: 'Niche-Based Organization',
    description: 'Products organized by niches make it easy to find relevant items for your target market. Browse by category to discover products that match your store theme.',
    icon: LayersIcon,
  },
  {
    title: 'Automatic Store Setup',
    description: 'Products are automatically added to your store with professional descriptions and images. Get a fully functional store created automatically in minutes.',
    icon: Sparkles,
    variant: 'success',
  },
  {
    title: 'Secure Credential Storage',
    description: 'Your Shopify credentials are encrypted and stored securely. We never share your data. Enterprise-grade security to protect your business.',
    icon: ShieldCheck,
    variant: 'danger',
  },
  {
    title: 'Real-Time Sync',
    description: 'See your products appear in Shopify instantly. No waiting, no delays. Changes are reflected immediately across all your connected stores.',
    icon: RefreshCcw,
    variant: 'primary',
  },
];

const mainFeatures = [
  {
    title: 'Browse Products',
    description: 'Choose from our curated catalog of ready-to-sell products across multiple niches. Find the perfect products for your store.',
    icon: ShoppingBag,
  },
  {
    title: 'Connect Shopify',
    description: 'Securely link your Shopify account in seconds. Manage multiple stores from one dashboard. Simple, fast, and secure.',
    icon: Link2,
  },
  {
    title: 'Launch Store',
    description: 'Get a fully functional store created automatically. Add products with one click and start selling immediately.',
    icon: Target,
  },
];

const benefits = [
  {
    title: 'No Technical Skills Required',
    description: 'Our platform handles all the technical complexity. You just browse, select, and launch. Perfect for beginners and experts alike.',
    icon: CheckCircle2,
  },
  {
    title: 'Curated Product Catalog',
    description: 'Every product in our catalog is carefully selected and optimized for e-commerce success. Quality products that sell.',
    icon: CheckCircle2,
  },
  {
    title: 'Fast & Reliable',
    description: 'Get your store up and running in minutes. Our automated system ensures everything works perfectly every time.',
    icon: CheckCircle2,
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-surface-base">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-surface-base via-surface-elevated to-surface-base py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6">
              Powerful Features
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Everything you need to build and manage your Shopify store quickly and efficiently.
              No technical skills required.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 bg-surface-elevated">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Powerful features to help you build and grow your online store
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {mainFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-surface-raised border border-border-default p-8 rounded-xl hover:border-primary-500 transition-all duration-300 hover:shadow-2xl group"
              >
                <IconBadge
                  icon={feature.icon}
                  label={feature.title}
                  size="lg"
                  variant={index === 0 ? 'primary' : index === 1 ? 'primary' : 'success'}
                  className="mb-6 group-hover:scale-110 transition-transform"
                />
                <h3 className="text-2xl font-bold mb-4 text-text-primary">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Features Grid */}
      <section className="py-20 bg-surface-base">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Complete Feature Set
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Everything you need to build and manage your Shopify store quickly and efficiently.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {detailedFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 hover:border-primary-500 hover:shadow-lg transition-all animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <IconBadge
                  icon={feature.icon}
                  label={feature.title}
                  variant={feature.variant ?? 'neutral'}
                  size="lg"
                  className="mb-4"
                />
                <h3 className="text-xl font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-surface-elevated">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                Why Choose Us
              </h2>
            </div>

            <div className="space-y-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="flex-shrink-0">
                    <IconBadge
                      icon={benefit.icon}
                      label={benefit.title}
                      size="md"
                      variant="primary"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">{benefit.title}</h3>
                    <p className="text-text-secondary leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-surface-base">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-surface-raised border border-border-default rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-text-secondary mb-8">
              Join thousands of entrepreneurs building successful Shopify stores with our platform.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/register"
                className="inline-flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-black px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                Get Started Free
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center bg-surface-hover hover:bg-surface-elevated text-text-primary px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 border border-border-default"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Back to Home */}
      <div className="py-8 text-center border-t border-border-default">
        <Link
          href="/"
          className="text-text-secondary hover:text-text-primary font-medium transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

