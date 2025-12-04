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
  Sparkles,
  ClipboardList,
  LogOut,
  ArrowLeftToLine,
  UserCheck,
  Send,
  X,
  ShoppingCart,
  Wallet,
  Zap,
  BarChart3,
  Mail,
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
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/zen-orders', label: 'ZEN Orders', icon: Zap },
  { href: '/admin/wallets', label: 'Wallets', icon: Wallet },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: Wallet },
  { href: '/admin/auto-orders', label: 'Auto Place Order', icon: Sparkles },
  { href: '/admin/niches', label: 'Niches', icon: Layers },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/product-analytics', label: 'Product Analytics', icon: BarChart3 },
  { href: '/admin/email-sender', label: 'Email Sender', icon: Mail },
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
          fixed lg:fixed
          top-0 left-0
          w-64 h-screen
          bg-surface-raised border-r border-border-default
          flex flex-col
          z-50 lg:z-30
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo and Close Button */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xl font-bold text-text-primary hover:text-text-secondary transition-all duration-200 hover:-translate-y-0.5"
            onClick={() => onClose?.()}
          >
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse-glow"></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 blur-sm opacity-50"></div>
            </div>
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

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 pb-24">
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
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg shadow-purple-500/25'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              <item.icon
                className={`h-5 w-5 transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-text-secondary group-hover:text-text-primary'
                }`}
                aria-hidden="true"
              />
              <span className="font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions - Fixed at bottom */}
      <div className="p-4 border-t border-white/10 bg-surface-raised space-y-2 flex-shrink-0">
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

