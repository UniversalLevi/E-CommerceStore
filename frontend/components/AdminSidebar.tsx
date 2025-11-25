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
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/stores', label: 'Stores', icon: '🏪' },
  { href: '/admin/niches', label: 'Niches', icon: '📂' },
  { href: '/admin/products', label: 'Products', icon: '📦' },
  { href: '/admin/contacts', label: 'Contacts', icon: '✉️' },
  { href: '/admin/audit', label: 'Audit Logs', icon: '📋' },
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
          className="text-xl font-bold text-text-primary hover:text-text-secondary transition-colors"
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-500 text-black font-semibold'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-default bg-surface-raised space-y-2">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors text-left"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Logout</span>
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
        >
          <span className="text-xl">←</span>
          <span className="font-medium">Back to Dashboard</span>
        </Link>
      </div>
    </aside>
  );
}

