'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Store,
  Package,
  CreditCard,
  BarChart3,
  Activity,
  HelpCircle,
  Settings,
  Megaphone,
  Bell,
  X,
  Users,
  ShoppingCart,
  Wallet,
  Mail,
  Video,
  Palette,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/stores', label: 'My Stores', icon: Store },
  { href: '/dashboard/templates', label: 'Templates', icon: Palette },
  { href: '/dashboard/customers', label: 'Customers', icon: Mail },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/products', label: 'My Products', icon: Package },
  { href: '/dashboard/ad-builder/instagram', label: 'Ad Builder', icon: Megaphone },
  { href: '/dashboard/video-mutator', label: 'Video Mutator', icon: Video },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/mentorship', label: 'Mentorship', icon: Users },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/activity', label: 'Activity', icon: Activity },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/help', label: 'Help', icon: HelpCircle },
  { href: '/dashboard/guide', label: 'Step-by-Step Guide', icon: HelpCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardSidebar({ isOpen = true, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

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
            className="flex items-center gap-2 text-xl font-bold text-text-primary hover:text-text-secondary transition-colors"
            onClick={() => onClose?.()}
          >
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse-glow"></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 blur-sm opacity-50"></div>
            </div>
            EAZY DROPSHIPPING
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
              className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 min-h-[44px] ${
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
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section - Fixed at bottom */}
      <div className="p-4 border-t border-white/10 bg-surface-raised flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold border border-white/20">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {user?.name || user?.email || 'User'}
            </p>
            {user?.role === 'admin' && (
              <p className="text-xs text-text-secondary">Admin</p>
            )}
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}

