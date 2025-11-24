'use client';

import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from './NotificationBell';
import Button from './Button';
import Link from 'next/link';

export default function DashboardTopbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-[#1a1a1a] border-b border-[#505050] h-16 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 h-full">
        {/* Left side - can add breadcrumbs or search here */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button could go here */}
        </div>

        {/* Right side - notifications and user menu */}
        <div className="flex items-center gap-4">
          <NotificationBell />
          
          {user?.role === 'admin' && (
            <Link
              href="/admin/dashboard"
              className="text-[#a0a0a0] hover:text-white transition-colors text-sm font-medium"
            >
              Admin Panel
            </Link>
          )}

          <Button
            variant="ghost"
            onClick={logout}
            className="text-[#a0a0a0] hover:text-white"
          >
            Logout
          </Button>

          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-semibold text-sm">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}

