'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/stores', label: 'My Stores', icon: '🏪' },
  { href: '/dashboard/products', label: 'My Products', icon: '📦' },
  { href: '/dashboard/billing', label: 'Billing', icon: '💳' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
  { href: '/dashboard/activity', label: 'Activity', icon: '🕐' },
  { href: '/dashboard/help', label: 'Help', icon: '❓' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-500 text-black font-semibold shadow-lg'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
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

