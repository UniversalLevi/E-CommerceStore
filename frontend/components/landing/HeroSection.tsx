'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center bg-gradient-hero">
      {/* Radial Glow Background */}
      <div className="absolute inset-0 bg-radial-glow-purple opacity-60"></div>
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30"></div>
      
      {/* Floating Shapes */}
      <div className="absolute top-20 right-20 w-2 h-2 bg-white/20 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
      <div className="absolute bottom-40 left-40 w-3 h-3 bg-purple-500/30 rounded-full animate-float" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-blue-500/30 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className="relative container mx-auto px-4 py-24 md:py-32 w-full z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left animate-fadeInUp">
              {/* Micro Subtitle */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-text-secondary">Automated Shopify Store Builder</span>
              </div>
              
              {/* Main Heading */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight">
                <span className="block text-gradient-purple">
                  Launch Your
                </span>
                <span className="block text-gradient-blue mt-2">
                  Shopify Store
                </span>
                <span className="block text-white mt-2">
                  in Minutes
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-lg md:text-xl lg:text-2xl text-text-secondary mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                No technical skills needed. Browse products, connect your Shopify account,
                and get a fully functional store automatically.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <button
                  onClick={onGetStarted}
                  className="group relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:-translate-y-1 min-h-[56px] flex items-center justify-center gap-2 overflow-hidden"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
                <Link
                  href="/login"
                  className="group bg-white/5 backdrop-blur-md hover:bg-white/10 text-white border-2 border-white/20 hover:border-white/40 px-8 py-4 rounded-full font-semibold text-lg transition-all min-h-[56px] flex items-center justify-center"
                >
                  Login
                </Link>
              </div>
            </div>
            
            {/* Right - Dashboard Mockup */}
            <div className="relative hidden lg:block animate-float">
              <div className="relative glass-card rounded-2xl p-6 shadow-2xl">
                {/* Mock Browser Header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                  <div className="flex-1 h-8 rounded-lg bg-white/5 ml-4"></div>
                </div>
                
                {/* Mock Dashboard Content */}
                <div className="space-y-4">
                  {/* Header Bar */}
                  <div className="h-12 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20"></div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 rounded-lg bg-white/5 border border-white/10"></div>
                    ))}
                  </div>
                  
                  {/* Content Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-24 rounded-lg bg-white/5 border border-white/10"></div>
                    ))}
                  </div>
                  
                  {/* Bottom Bar */}
                  <div className="h-8 rounded-lg bg-white/5"></div>
                </div>
                
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-xl opacity-20 -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

