'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && mounted) {
      if (!user || user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router, mounted]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null; // Will redirect
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/stores', label: 'Stores' },
    { href: '/admin/niches', label: 'Niches' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/audit', label: 'Audit Logs' },
  ];

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Navigation */}
      <nav className="bg-surface-raised border-b border-border-default shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-yellow-500 hover:text-yellow-400 transition-colors">
              Auto Shopify Store Builder
            </Link>
            <div className="flex items-center gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${
                    pathname === item.href
                      ? 'text-yellow-500 font-medium'
                      : 'text-text-secondary hover:text-text-primary'
                  } transition-colors`}
                >
                  {item.label}
                </Link>
              ))}
              <span className="text-text-secondary">{user.email}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="bg-surface-base min-h-screen">
        {children}
      </div>
    </div>
  );
}

