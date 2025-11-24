'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingScreen from '@/components/LoadingScreen';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    } else if (!loading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-base flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <main className="flex-1 overflow-y-auto bg-surface-base p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

