'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Instagram, Facebook, Sparkles, Users } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';

interface TabItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { href: '/ad-builder/instagram', label: 'Instagram Ads', icon: Instagram },
  { href: '/ad-builder/facebook', label: 'Facebook Ads', icon: Facebook },
  { href: '/ad-builder/content', label: 'Content Finder', icon: Sparkles },
  { href: '/ad-builder/mentorship', label: 'Mentorship', icon: Users },
];

export default function AdsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Header */}
      <header className="bg-surface-raised border-b border-border-default sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-text-primary hover:text-text-secondary transition-colors">
                Store Builder
              </Link>
              <span className="mx-4 text-text-secondary">/</span>
              <span className="text-text-primary font-medium">Ad Builder</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-surface-raised border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
              const Icon = tab.icon;
              
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? 'border-yellow-500 text-yellow-500 font-semibold'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-default'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

