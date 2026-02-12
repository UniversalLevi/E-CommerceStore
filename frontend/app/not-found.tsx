'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof pathname !== 'string' || !pathname.startsWith('/dashboard')) return;
    const isEazyStores =
      pathname === '/dashboard/stores' || pathname.startsWith('/dashboard/store');
    router.replace(isEazyStores ? '/dashboard/stores' : '/dashboard');
  }, [pathname, router]);

  if (typeof pathname === 'string' && pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl font-bold text-text-primary mb-4">404</div>
        <h1 className="text-2xl font-semibold text-text-primary mb-2">Page Not Found</h1>
        <p className="text-text-secondary mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-black rounded-lg font-medium transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
