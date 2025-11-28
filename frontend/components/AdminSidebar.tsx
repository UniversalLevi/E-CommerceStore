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
  { href: '/admin/dashboard', label: 'Dashboard', badge: 'AD', variant: 'primary' },
  { href: '/admin/users', label: 'Users', badge: 'US', variant: 'neutral' },
  { href: '/admin/stores', label: 'Stores', badge: 'ST', variant: 'neutral' },
  { href: '/admin/niches', label: 'Niches', badge: 'NC', variant: 'neutral' },
  { href: '/admin/products', label: 'Products', badge: 'PR', variant: 'neutral' },
  { href: '/admin/revenue', label: 'Revenue', badge: 'RV', variant: 'success' },
  { href: '/admin/subscriptions', label: 'Subscriptions', badge: 'SB', variant: 'warning' },
  { href: '/admin/contacts', label: 'Contacts', badge: 'CT', variant: 'neutral' },
  { href: '/admin/audit', label: 'Audit Logs', badge: 'AL', variant: 'danger' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-surface-raised border-r border-border-default h-screen fixed left-0 top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-border-default">
        <Link 
          href="/" 
          className="text-xl font-bold text-text-primary hover:text-text-secondary transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center gap-2"
        >
          Admin Panel
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
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500 text-black font-semibold shadow-xl'
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
              <span className="font-medium tracking-wide">{item.label}</span>
              <span
                className={`absolute inset-y-1 right-2 w-[2px] rounded-full transition-all duration-200 ${
                  isActive ? 'bg-black/50 opacity-100 scale-y-100' : 'opacity-0 scale-y-0 group-hover:opacity-60 group-hover:scale-y-100 bg-primary-500/60'
                }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-default bg-surface-raised space-y-2">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all duration-200 hover:-translate-y-0.5 text-left"
        >
          <IconBadge text="LO" label="Logout" size="sm" variant="danger" className="shrink-0" />
          <span className="font-medium">Logout</span>
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all duration-200 hover:-translate-y-0.5"
        >
          <IconBadge text="DB" label="Dashboard" size="sm" variant="primary" className="shrink-0" />
          <span className="font-medium">Back to Dashboard</span>
        </Link>
      </div>
    </aside>
  );
}

