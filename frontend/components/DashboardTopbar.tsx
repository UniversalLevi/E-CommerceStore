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
    <header className="bg-[#1a1a1a] border-b border-[#505050] h-16 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 md:px-6 h-full">
        {/* Left side - Mobile menu button */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-[#a0a0a0] hover:text-white transition-colors rounded-lg hover:bg-[#2a2a2a] min-h-[44px] min-w-[44px] flex items-center justify-center"
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
              className="hidden md:block text-[#a0a0a0] hover:text-white transition-colors text-sm font-medium"
            >
              Admin Panel
            </Link>
          )}

          <Button
            variant="ghost"
            onClick={logout}
            className="text-[#a0a0a0] hover:text-white text-sm md:text-base"
          >
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Out</span>
          </Button>

          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-semibold text-sm">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}

