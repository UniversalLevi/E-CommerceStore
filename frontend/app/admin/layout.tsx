'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingScreen from '@/components/LoadingScreen';
import { Menu } from 'lucide-react';

export default function AdminLayout({
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
    } else if (!loading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [loading, isAuthenticated, user, router]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-base flex">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Mobile header with menu button */}
        <header className="lg:hidden bg-[#1a1a1a] border-b border-[#505050] h-16 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 h-full">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-[#a0a0a0] hover:text-white transition-colors rounded-lg hover:bg-[#2a2a2a] min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-semibold text-sm">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-surface-base p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

