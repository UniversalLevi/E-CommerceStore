'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VideoIntro from '@/components/VideoIntro';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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
} from 'lucide-react';
import HeroSection from '@/components/landing/HeroSection';
import StatsSection from '@/components/landing/StatsSection';
import HowItWorks from '@/components/landing/HowItWorks';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import StorePreview from '@/components/landing/StorePreview';
import TemplatesSection from '@/components/landing/TemplatesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import type { IconBadgeVariant } from '@/components/IconBadge';

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
  type FeatureCard = { title: string; description: string; icon: LucideIcon; variant?: IconBadgeVariant };
  const detailedFeatures: FeatureCard[] = [
    {
      title: 'Easy Store Connection',
      description: 'Connect your Shopify store in minutes with just your access token. No complex setup required.',
      icon: Link2,
      variant: 'primary',
    },
    {
      title: 'Curated Product Catalog',
      description: 'Browse thousands of products organized by niches. Find exactly what you need for your store.',
      icon: Tags,
    },
    {
      title: 'One-Click Product Addition',
      description: 'Add products to your Shopify store with a single click. All details, images, and pricing included.',
      icon: MousePointerClick,
      variant: 'success',
    },
    {
      title: 'Multiple Store Management',
      description: 'Manage multiple Shopify stores from one account. Switch between stores effortlessly.',
      icon: Building2,
    },
    {
      title: 'Niche-Based Organization',
      description: 'Products organized by niches make it easy to find relevant items for your target market.',
      icon: LayersIcon,
    },
    {
      title: 'Automatic Store Setup',
      description: 'Products are automatically added to your store with professional descriptions and images.',
      icon: Sparkles,
      variant: 'success',
    },
    {
      title: 'Secure Credential Storage',
      description: 'Your Shopify credentials are encrypted and stored securely. We never share your data.',
      icon: ShieldCheck,
      variant: 'danger',
    },
    {
      title: 'Real-Time Sync',
      description: 'See your products appear in Shopify instantly. No waiting, no delays.',
      icon: RefreshCcw,
      variant: 'primary',
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

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard/billing');
    } else {
      router.push('/login');
    }
  };

  // Prepare features for FeaturesGrid with gradients
  const featuresWithGradients = detailedFeatures.map((feature, index) => {
    const gradients = [
      'from-purple-500/20 to-purple-600/20',
      'from-blue-500/20 to-blue-600/20',
      'from-teal-500/20 to-teal-600/20',
      'from-pink-500/20 to-pink-600/20',
    ];
    return {
      ...feature,
      gradient: gradients[index % gradients.length],
    };
  });

  return (
    <>
      {mounted && !showContent && <VideoIntro onComplete={handleIntroComplete} />}
      
      <div 
        className={`min-h-screen bg-black transition-opacity duration-1000 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Hero Section */}
        <HeroSection onGetStarted={handleGetStarted} />

        {/* Stats Section */}
        <StatsSection />

        {/* How It Works */}
        <HowItWorks />

        {/* Store Preview */}
        <StorePreview />

        {/* Features Grid */}
        <FeaturesGrid features={featuresWithGradients} />

        {/* Templates Section */}
        <TemplatesSection />

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Pricing Section */}
        <PricingSection 
          plans={plans}
          loading={loadingPlans}
          onGetStarted={handleGetStarted}
          formatPrice={formatPrice}
        />
      </div>
    </>
  );
}

