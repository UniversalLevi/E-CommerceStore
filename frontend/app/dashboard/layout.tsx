'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardTopbar from '@/components/DashboardTopbar';
import DashboardTabs from '@/components/DashboardTabs';
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

  return (
    <div className="min-h-screen bg-surface-base flex">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <DashboardTopbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <DashboardTabs />
        <main className="flex-1 overflow-y-auto bg-surface-base p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

