'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Loader2,
  Store,
  ChevronRight
} from 'lucide-react';
import { StoreContext } from '@/contexts/StoreContext';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: '/dashboard/store/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/store/products', label: 'Products', icon: Package },
  { href: '/dashboard/store/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/store/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/store/settings', label: 'Settings', icon: Settings },
];

export default function StoreDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchStore();
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchStore = async () => {
    try {
      setLoading(true);
      const response = await api.getMyStore();
      if (response.success && response.data) {
        setStore(response.data);
      } else {
        // No store found, redirect to create or main store page
        if (pathname !== '/dashboard/store' && !pathname.includes('/create')) {
          router.push('/dashboard/store');
        }
      }
    } catch (error: any) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStore = async () => {
    await fetchStore();
  };

  // Don't show layout on create page or main store page
  if (pathname === '/dashboard/store/create' || pathname === '/dashboard/store') {
    return <>{children}</>;
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!store) {
    return <>{children}</>;
  }

  return (
    <StoreContext.Provider value={{ store, loading, refreshStore }}>
      <div className="space-y-6">
        {/* Store Header */}
        <div className="bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10 rounded-xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{store.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-text-secondary">
                    {store.slug}.eazyds.com
                  </p>
                  <a
                    href={`https://${store.slug}.eazyds.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 underline"
                  >
                    View Store
                  </a>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {store.status === 'active' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400 border border-green-500/30">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-500/20 text-gray-400 border border-gray-500/30">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="bg-surface-raised rounded-lg border border-border-default p-1">
          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-md transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Page Content */}
        <div className="min-h-[400px]">
          {children}
        </div>
      </div>
    </StoreContext.Provider>
  );
}
