'use client';

import IconBadge, { IconBadgeVariant } from '@/components/IconBadge';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: IconBadgeVariant;
  gradient: string;
}

interface FeaturesGridProps {
  features: Feature[];
}

export default function FeaturesGrid({ features }: FeaturesGridProps) {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-black via-[#0D0D0D] to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
            <span className="text-gradient-blue">Powerful Features</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Everything you need to build and manage your Shopify store quickly and efficiently.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group glass-card glass-card-hover rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 animate-fadeInUp"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={`relative mb-4 p-4 rounded-xl bg-gradient-to-br ${feature.gradient} opacity-20 group-hover:opacity-30 transition-opacity`}>
                  <IconBadge
                    icon={Icon}
                    label={feature.title}
                    variant={feature.variant ?? 'neutral'}
                    size="lg"
                    className="group-hover:scale-110 transition-transform"
                  />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

