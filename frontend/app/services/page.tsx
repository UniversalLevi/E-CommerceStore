'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Megaphone, Users, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function ServicesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  const services = [
    {
      id: 'ads-management',
      title: 'Ads Management Services',
      description: 'Performance-driven ad management with transparent pricing and shared growth incentives.',
      icon: Megaphone,
      href: '/services/ads-management',
      gradient: 'from-blue-600 to-purple-600',
      features: [
        'Ad account setup & structure',
        'Audience research',
        'Creative strategy guidance',
        'Budget optimization',
        'Weekly performance reviews',
      ],
    },
    {
      id: 'connect-experts',
      title: 'Connect with Experts',
      description: 'Direct access to industry experts focused on achieving real sales milestones.',
      icon: Users,
      href: '/services/connect-experts',
      gradient: 'from-purple-600 to-pink-600',
      features: [
        'Scheduled expert calls',
        'Business audits',
        'Custom growth roadmap',
        'Performance checkpoints',
        'Priority support access',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-gradient-blue">Growth Solutions</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Choose the service that fits your business needs. We offer execution-focused solutions with transparent pricing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.id}
                href={service.href}
                className="group relative glass-card rounded-3xl p-8 transition-all duration-500 hover:scale-105 border border-white/10 hover:border-white/20"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${service.gradient} mb-6`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-3">{service.title}</h2>
                <p className="text-text-secondary mb-6">{service.description}</p>

                <ul className="space-y-2 mb-6">
                  {service.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-text-secondary text-sm">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center text-purple-400 font-semibold group-hover:text-purple-300 transition-colors">
                  Learn More
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-text-secondary mb-4">
            Need help choosing the right service?
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
