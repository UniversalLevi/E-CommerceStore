'use client';

import { ShoppingBag, Zap, Globe } from 'lucide-react';

export default function StatsSection() {
  const stats = [
    {
      icon: ShoppingBag,
      value: '1000+',
      label: 'Products Available',
      gradient: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-400',
    },
    {
      icon: Zap,
      value: '5 Min',
      label: 'Setup Time',
      gradient: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-400',
    },
    {
      icon: Globe,
      value: '24/7',
      label: 'Support',
      gradient: 'from-teal-500/20 to-teal-600/20',
      iconColor: 'text-teal-400',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-black via-[#0D0D0D] to-black">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group glass-card glass-card-hover rounded-2xl p-8 text-center transition-all duration-300 hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-8 h-8 ${stat.iconColor}`} />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-gradient-purple mb-2">
                  {stat.value}
                </div>
                <div className="text-text-secondary text-lg">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

