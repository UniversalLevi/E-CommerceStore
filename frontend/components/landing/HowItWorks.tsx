'use client';

import { ShoppingBag, Link2, Sparkles, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Step {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: ShoppingBag,
    title: 'Choose a Product',
    description: 'Browse our curated catalog and select products that match your niche',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    number: 2,
    icon: Link2,
    title: 'Connect Shopify',
    description: 'Securely link your Shopify store with just your access token',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    number: 3,
    icon: Sparkles,
    title: 'Auto-Generated Store',
    description: 'We automatically create your store with products, descriptions, and themes',
    gradient: 'from-teal-500 to-teal-600',
  },
  {
    number: 4,
    icon: Rocket,
    title: 'Ready to Sell',
    description: 'Your store is live! Start selling immediately with zero technical setup',
    gradient: 'from-pink-500 to-pink-600',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-black via-[#0D0D0D] to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-pattern opacity-20"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
            <span className="text-gradient-purple">How It Works</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Get your store up and running in 4 simple steps
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting Line (Desktop Only) */}
            <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/50 via-blue-500/50 via-teal-500/50 to-pink-500/50"></div>
            
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="relative group animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {/* Step Number Circle */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform`}>
                      {step.number}
                    </div>
                  </div>
                  
                  {/* Step Card */}
                  <div className="glass-card glass-card-hover rounded-2xl p-8 pt-12 text-center h-full transition-all duration-300 hover:-translate-y-2">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-3">
                      {step.title}
                    </h3>
                    <p className="text-text-secondary leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

