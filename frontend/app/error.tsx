'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import IconBadge from '@/components/IconBadge';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface-raised border border-border-default rounded-xl shadow-lg p-8 text-center space-y-4">
        <div className="flex justify-center">
          <IconBadge label="Error" text="ERR" size="lg" variant="danger" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Something went wrong</h1>
        <p className="text-text-secondary mb-6">
          We encountered an unexpected error. Please try again or contact support if the problem
          persists.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg text-left">
            <p className="text-sm font-mono text-red-200 break-all">{error.message}</p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="primary">
            Retry
          </Button>
          <Link href="/dashboard">
            <Button variant="secondary">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

