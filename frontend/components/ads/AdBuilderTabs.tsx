'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Instagram, Facebook, Sparkles } from 'lucide-react';

interface TabItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { href: '/dashboard/ad-builder/instagram', label: 'Instagram Ads', icon: Instagram },
  { href: '/dashboard/ad-builder/facebook', label: 'Facebook Ads', icon: Facebook },
  { href: '/dashboard/ad-builder/content', label: 'Content Finder', icon: Sparkles },
];

export default function AdBuilderTabs() {
  const pathname = usePathname();

  return (
    <nav className="bg-surface-raised border border-border-default rounded-lg overflow-hidden">
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
    </nav>
  );
}


