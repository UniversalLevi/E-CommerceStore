'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VideoIntro from '@/components/VideoIntro';
import IconBadge, { IconBadgeVariant } from '@/components/IconBadge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Plan {
  code: string;
  name: string;
  price: number;
  durationDays: number | null;
  isLifetime: boolean;
  maxProducts: number | null;
  features: string[];
}

export default function Home() {
  const [showContent, setShowContent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  type FeatureCard = { title: string; description: string; badge: string; variant?: IconBadgeVariant };
  const detailedFeatures: FeatureCard[] = [
    {
      title: 'Easy Store Connection',
      description: 'Connect your Shopify store in minutes with just your access token. No complex setup required.',
      badge: 'SC',
      variant: 'primary',
    },
    {
      title: 'Curated Product Catalog',
      description: 'Browse thousands of products organized by niches. Find exactly what you need for your store.',
      badge: 'PC',
    },
    {
      title: 'One-Click Product Addition',
      description: 'Add products to your Shopify store with a single click. All details, images, and pricing included.',
      badge: 'OC',
      variant: 'success',
    },
    {
      title: 'Multiple Store Management',
      description: 'Manage multiple Shopify stores from one account. Switch between stores effortlessly.',
      badge: 'MS',
    },
    {
      title: 'Niche-Based Organization',
      description: 'Products organized by niches make it easy to find relevant items for your target market.',
      badge: 'NO',
    },
    {
      title: 'Automatic Store Setup',
      description: 'Products are automatically added to your store with professional descriptions and images.',
      badge: 'AS',
      variant: 'success',
    },
    {
      title: 'Secure Credential Storage',
      description: 'Your Shopify credentials are encrypted and stored securely. We never share your data.',
      badge: 'SS',
      variant: 'danger',
    },
    {
      title: 'Real-Time Sync',
      description: 'See your products appear in Shopify instantly. No waiting, no delays.',
      badge: 'RT',
      variant: 'primary',
    },
  ];

  const benefits: Array<{ title: string; description: string }> = [
    {
      title: 'No Technical Skills Required',
      description: 'Our platform handles all the technical complexity. You just browse, select, and launch.',
    },
    {
      title: 'Curated Product Catalog',
      description: 'Every product in our catalog is carefully selected and optimized for e-commerce success.',
    },
    {
      title: 'Automatic Product Setup',
      description: 'Products include professional descriptions, images, and pricing so you can start selling faster.',
    },
  ];

  const handleIntroComplete = () => {
    setShowContent(true);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.getPlans();
        if (response.success && response.data?.plans) {
          setPlans(response.data.plans);
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  const formatPrice = (priceInPaise: number) => {
    return `₹${(priceInPaise / 100).toLocaleString('en-IN')}`;
  };

  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      router.push('/dashboard/billing');
    } else {
      router.push('/login');
    }
  };

  return (
    <>
      {mounted && !showContent && <VideoIntro onComplete={handleIntroComplete} />}
      
      <div 
        className={`min-h-screen bg-surface-base transition-opacity duration-1000 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
      >
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center bg-gradient-to-b from-surface-base via-surface-elevated to-surface-base">
        <div className="relative container mx-auto px-4 py-24 md:py-32 w-full">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-text-primary mb-6 leading-tight">
              Launch Your Shopify Store
              <span className="block mt-2">in Minutes</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed">
              No technical skills needed. Browse products, connect your Shopify account,
              and get a fully functional store automatically.
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap mb-16">
              <button
                onClick={handleGetStarted}
                className="bg-primary-500 hover:bg-primary-600 text-black px-10 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Get Started Free
              </button>
              <Link
                href="/login"
                className="bg-transparent hover:bg-surface-hover text-text-primary border-2 border-primary-500 px-10 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                Login
              </Link>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center bg-surface-raised border border-border-default rounded-lg p-6">
                <div className="text-4xl font-bold text-text-primary mb-2">1000+</div>
                <div className="text-text-secondary">Products Available</div>
              </div>
              <div className="text-center bg-surface-raised border border-border-default rounded-lg p-6">
                <div className="text-4xl font-bold text-text-primary mb-2">5 Min</div>
                <div className="text-text-secondary">Setup Time</div>
              </div>
              <div className="text-center bg-surface-raised border border-border-default rounded-lg p-6">
                <div className="text-4xl font-bold text-text-primary mb-2">24/7</div>
                <div className="text-text-secondary">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
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
            <div className="bg-surface-raised border border-border-default p-8 rounded-xl hover:border-primary-500 transition-all duration-300 hover:shadow-2xl group">
              <IconBadge
                text="BP"
                label="Browse Products"
                size="lg"
                className="mb-6 group-hover:scale-110 transition-transform"
              />
              <h3 className="text-2xl font-bold mb-4 text-text-primary">Browse Products</h3>
              <p className="text-text-secondary leading-relaxed">
                Choose from our curated catalog of ready-to-sell products across multiple niches. 
                Find the perfect products for your store.
              </p>
            </div>
            
            <div className="bg-surface-raised border border-border-default p-8 rounded-xl hover:border-primary-500 transition-all duration-300 hover:shadow-2xl group">
              <IconBadge
                text="CS"
                label="Connect Shopify"
                size="lg"
                variant="primary"
                className="mb-6 group-hover:scale-110 transition-transform"
              />
              <h3 className="text-2xl font-bold mb-4 text-text-primary">Connect Shopify</h3>
              <p className="text-text-secondary leading-relaxed">
                Securely link your Shopify account in seconds. Manage multiple stores 
                from one dashboard.
              </p>
            </div>
            
            <div className="bg-surface-raised border border-border-default p-8 rounded-xl hover:border-primary-500 transition-all duration-300 hover:shadow-2xl group">
              <IconBadge
                text="LS"
                label="Launch store"
                size="lg"
                variant="success"
                className="mb-6 group-hover:scale-110 transition-transform"
              />
              <h3 className="text-2xl font-bold mb-4 text-text-primary">Launch Store</h3>
              <p className="text-text-secondary leading-relaxed">
                Get a fully functional store created automatically. Add products with 
                one click and start selling immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-surface-base">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                Why Choose Us
              </h2>
            </div>

            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-500 text-black flex items-center justify-center text-2xl font-bold">
                  01
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">No Technical Skills Required</h3>
                  <p className="text-text-secondary">
                    Our platform handles all the technical complexity. You just browse, select, and launch.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-500 text-black flex items-center justify-center text-2xl font-bold">
                  02
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Curated Product Catalog</h3>
                  <p className="text-text-secondary">
                    Every product in our catalog is carefully selected and optimized for e-commerce success.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-500 text-black flex items-center justify-center text-2xl font-bold">
                  03
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Fast & Reliable</h3>
                  <p className="text-text-secondary">
                    Get your store up and running in minutes. Our automated system ensures 
                    everything works perfectly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-surface-elevated">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Select the perfect plan for your business needs. All plans include full access to our product catalog.
            </p>
          </div>

          {loadingPlans ? (
            <div className="text-center py-12">
              <div className="text-text-secondary">Loading plans...</div>
            </div>
          ) : plans.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => {
                const isPopular = index === 1; // Middle plan is popular
                const isLifetime = plan.isLifetime;
                
                return (
                  <div
                    key={plan.code}
                    className={`relative bg-surface-raised border rounded-xl p-8 transition-all duration-300 hover:shadow-2xl ${
                      isPopular
                        ? 'border-primary-500 border-2 shadow-lg scale-105'
                        : 'border-border-default hover:border-primary-500'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-text-primary mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-text-primary">
                          {formatPrice(plan.price)}
                        </span>
                        {!isLifetime && plan.durationDays && (
                          <span className="text-text-secondary ml-2">
                            / {plan.durationDays === 30 ? 'month' : plan.durationDays === 90 ? 'quarter' : `${plan.durationDays} days`}
                          </span>
                        )}
                      </div>
                      {isLifetime && (
                        <div className="text-sm text-primary-500 font-semibold mb-2">
                          One-time payment
                        </div>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="mt-1 h-2 w-2 rounded-full bg-primary-500"></span>
                          <span className="text-text-secondary">{feature}</span>
                        </li>
                      ))}
                      {plan.maxProducts !== null ? (
                        <li className="flex items-start gap-3">
                          <span className="mt-1 h-2 w-2 rounded-full bg-primary-500"></span>
                          <span className="text-text-secondary">
                            Up to {plan.maxProducts} products
                          </span>
                        </li>
                      ) : (
                        <li className="flex items-start gap-3">
                          <span className="mt-1 h-2 w-2 rounded-full bg-primary-500"></span>
                          <span className="text-text-secondary font-semibold">
                            Unlimited products
                          </span>
                        </li>
                      )}
                    </ul>

                    <button
                      onClick={handleGetStarted}
                      className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all ${
                        isPopular
                          ? 'bg-primary-500 hover:bg-primary-600 text-black'
                          : 'bg-surface-hover hover:bg-surface-hover/80 text-text-primary border border-border-default'
                      }`}
                    >
                      Get Started
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-text-secondary">No plans available at the moment.</div>
            </div>
          )}
        </div>
      </section>

      {/* Detailed Features Section */}
      <section className="py-20 bg-surface-base">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Everything you need to build and manage your Shopify store quickly and efficiently.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 max-w-7xl mx-auto">
            {detailedFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 hover:border-primary-500 hover:shadow-lg transition-all"
              >
                <IconBadge
                  text={feature.badge}
                  label={feature.title}
                  variant={feature.variant ?? 'neutral'}
                  size="lg"
                  className="mb-4"
                />
                <h3 className="text-xl font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-text-secondary text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

