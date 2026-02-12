'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * When a dashboard sub-route does not exist, redirect to the current tab's home
 * without switching tabs: Eazy Stores -> /dashboard/stores, EazyDS -> /dashboard
 */
export default function DashboardNotFound() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isEazyStoresRoute =
      pathname === '/dashboard/stores' ||
      pathname.startsWith('/dashboard/store');
    const tabHome = isEazyStoresRoute ? '/dashboard/stores' : '/dashboard';
    router.replace(tabHome);
  }, [pathname, router]);

  return null;
}
