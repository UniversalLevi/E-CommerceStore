'use client';

import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from './NotificationBell';
import Button from './Button';
import Link from 'next/link';

export default function DashboardTopbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gray-800 border-b border-gray-700 h-16 sticky top-0 z-40">
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
              className="text-gray-300 hover:text-primary-400 transition-colors text-sm font-medium"
            >
              Admin Panel
            </Link>
          )}

          <Button
            variant="ghost"
            onClick={logout}
            className="text-gray-300 hover:text-white"
          >
            Logout
          </Button>

          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}

