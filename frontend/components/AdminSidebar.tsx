'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Store,
  Layers,
  Package,
  LineChart,
  BadgeCheck,
  MessageSquare,
  ClipboardList,
  LogOut,
  ArrowLeftToLine,
  UserCheck,
  Send,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/stores', label: 'Stores', icon: Store },
  { href: '/admin/niches', label: 'Niches', icon: Layers },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/revenue', label: 'Revenue', icon: LineChart },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: BadgeCheck },
  { href: '/admin/mentorship/applications', label: 'Mentorship', icon: UserCheck },
  { href: '/admin/contacts', label: 'Contacts', icon: MessageSquare },
  { href: '/admin/notifications/send', label: 'Send Notification', icon: Send },
  { href: '/admin/audit', label: 'Audit Logs', icon: ClipboardList },
];

export default function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative
          top-0 left-0
          w-64 h-screen
          bg-surface-raised border-r border-border-default
          overflow-y-auto
          z-50 lg:z-auto
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo and Close Button */}
        <div className="p-6 border-b border-border-default flex items-center justify-between">
          <Link 
            href="/" 
            className="text-xl font-bold text-text-primary hover:text-text-secondary transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center gap-2"
            onClick={() => onClose?.()}
          >
            Admin Panel
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-hover"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          // Check if this route matches
          const routeMatches = pathname === item.href || pathname.startsWith(item.href + '/');
          
          // Check if there's a more specific route that also matches
          const hasMoreSpecificMatch = navItems.some(
            (otherItem) =>
              otherItem.href !== item.href &&
              otherItem.href.length > item.href.length &&
              (pathname === otherItem.href || pathname.startsWith(otherItem.href + '/'))
          );
          
          // Only active if this route matches AND there's no more specific match
          const isActive = routeMatches && !hasMoreSpecificMatch;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 min-h-[44px] ${
                isActive
                  ? 'bg-yellow-500 text-black font-semibold shadow-xl'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <item.icon
                className={`h-5 w-5 transition-colors duration-200 ${
                  isActive ? 'text-black' : 'text-text-secondary group-hover:text-text-primary'
                }`}
                aria-hidden="true"
              />
              <span className="font-medium tracking-wide">{item.label}</span>
              <span
                className={`absolute inset-y-1 right-2 w-[2px] rounded-full transition-all duration-200 ${
                  isActive ? 'bg-black/50 opacity-100 scale-y-100' : 'opacity-0 scale-y-0 group-hover:opacity-60 group-hover:scale-y-100 bg-yellow-500/60'
                }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-default bg-surface-raised space-y-2">
        <button
          onClick={() => {
            onClose?.();
            logout();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all duration-200 hover:-translate-y-0.5 text-left min-h-[44px]"
        >
          <LogOut className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          <span className="font-medium">Logout</span>
        </button>
        <Link
          href="/dashboard"
          onClick={() => onClose?.()}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all duration-200 hover:-translate-y-0.5 min-h-[44px]"
        >
          <ArrowLeftToLine className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          <span className="font-medium">Back to Dashboard</span>
        </Link>
      </div>
      </aside>
    </>
  );
}

