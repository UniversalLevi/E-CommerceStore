'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardTopbar from '@/components/DashboardTopbar';
import LoadingScreen from '@/components/LoadingScreen';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!loading && user?.role === 'admin') {
      // Only redirect if we're not already on an admin page
      if (!pathname?.startsWith('/admin')) {
        router.push('/admin/dashboard');
      }
      return;
    }
  }, [loading, isAuthenticated, user, router, pathname]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || !isAuthenticated || user.role === 'admin') {
    return null;
  }

  const isEazyStoresTab =
    pathname === '/dashboard/stores' || (pathname?.startsWith('/dashboard/store') ?? false);

  return (
    <div className="min-h-screen bg-surface-base flex">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <DashboardTopbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        {/* Top-level tabs: EazyDS (platform) vs Eazy Stores */}
        <div className="sticky top-16 z-30 shrink-0 border-b border-white/10 bg-black/30 backdrop-blur-sm overflow-x-auto">
          <nav className="flex gap-1 px-4 md:px-6 py-2 min-w-0" aria-label="Dashboard sections" role="tablist">
            <button
              type="button"
              role="tab"
              onClick={() => router.push('/dashboard')}
              aria-current={!isEazyStoresTab ? 'page' : undefined}
              aria-selected={!isEazyStoresTab}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0 ${
                !isEazyStoresTab
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              EazyDS
            </button>
            <button
              type="button"
              role="tab"
              onClick={() => router.push('/dashboard/stores')}
              aria-current={isEazyStoresTab ? 'page' : undefined}
              aria-selected={isEazyStoresTab}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0 ${
                isEazyStoresTab
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              Eazy Stores
            </button>
          </nav>
        </div>
        <main className="flex-1 overflow-y-auto bg-surface-base p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

