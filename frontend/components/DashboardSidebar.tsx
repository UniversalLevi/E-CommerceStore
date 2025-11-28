'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import IconBadge from './IconBadge';

interface NavItem {
  href: string;
  label: string;
  badge?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', badge: 'DB', variant: 'primary' },
  { href: '/dashboard/stores', label: 'My Stores', badge: 'ST' },
  { href: '/dashboard/products', label: 'My Products', badge: 'PR' },
  { href: '/dashboard/billing', label: 'Billing', badge: 'BL', variant: 'warning' },
  { href: '/dashboard/analytics', label: 'Analytics', badge: 'AN' },
  { href: '/dashboard/activity', label: 'Activity', badge: 'AC' },
  { href: '/dashboard/help', label: 'Help', badge: 'HP' },
  { href: '/settings', label: 'Settings', badge: 'SE' },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-surface-raised border-r border-border-default h-screen fixed left-0 top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-border-default">
        <Link 
          href="/" 
          className="text-xl font-bold text-text-primary hover:text-text-secondary transition-colors"
        >
          Store Builder
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500 text-black font-semibold shadow-lg'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <IconBadge
                text={item.badge}
                label={item.label}
                size="sm"
                variant={item.variant || 'neutral'}
                className={`shrink-0 ${isActive ? 'bg-black/10 text-black border-white/40' : 'group-hover:border-primary-500/40'}`}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-default bg-surface-raised">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-black font-semibold">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {user?.email || 'User'}
            </p>
            {user?.role === 'admin' && (
              <p className="text-xs text-text-secondary">Admin</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

