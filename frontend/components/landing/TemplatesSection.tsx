'use client';

import { Store, ArrowRight } from 'lucide-react';

interface Template {
  name: string;
  description: string;
  gradient: string;
}

const templates: Template[] = [
  {
    name: 'Modern Minimal',
    description: 'Clean, professional design perfect for any niche',
    gradient: 'from-purple-500/20 to-blue-500/20',
  },
  {
    name: 'Bold Commerce',
    description: 'Eye-catching layouts that drive conversions',
    gradient: 'from-blue-500/20 to-teal-500/20',
  },
  {
    name: 'Elegant Classic',
    description: 'Timeless design that never goes out of style',
    gradient: 'from-teal-500/20 to-purple-500/20',
  },
  {
    name: 'Premium Pro',
    description: 'High-end aesthetic for luxury brands',
    gradient: 'from-pink-500/20 to-purple-500/20',
  },
];

export default function TemplatesSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-black via-[#0D0D0D] to-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
            <span className="text-gradient-teal">Beautiful Store Templates</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Professional, conversion-optimized themes ready to use
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {templates.map((template, index) => (
            <div
              key={index}
              className="group glass-card glass-card-hover rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Template Preview Area */}
              <div className={`h-48 bg-gradient-to-br ${template.gradient} flex items-center justify-center relative overflow-hidden`}>
                <Store className="w-16 h-16 text-white/40 group-hover:text-white/60 transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
              
              {/* Template Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  {template.description}
                </p>
                <button className="text-purple-400 hover:text-purple-300 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                  Preview Template <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

