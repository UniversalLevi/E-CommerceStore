'use client';

import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from './NotificationBell';
import Button from './Button';
import Link from 'next/link';
import { Menu } from 'lucide-react';

interface DashboardTopbarProps {
  onMenuClick?: () => void;
}

export default function DashboardTopbar({ onMenuClick }: DashboardTopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/50 border-b border-white/10 h-16">
      <div className="flex items-center justify-between px-4 md:px-6 h-full">
        {/* Left side - Mobile menu button */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Right side - notifications and user menu */}
        <div className="flex items-center gap-2 md:gap-4">
          <NotificationBell />
          
          {user?.role === 'admin' && (
            <Link
              href="/admin/dashboard"
              className="hidden md:block text-text-secondary hover:text-white transition-colors text-sm font-medium"
            >
              Admin Panel
            </Link>
          )}

          <Button
            variant="ghost"
            onClick={logout}
            className="text-text-secondary hover:text-white text-sm md:text-base"
          >
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Out</span>
          </Button>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm border border-white/20">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}

