'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { refreshUser } = useAuth();

  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid verification token');
      return;
    }

    // Auto-verify on mount
    handleVerify();
  }, [token]);

  const handleVerify = async () => {
    if (!token) {
      setError('Invalid verification token');
      return;
    }

    try {
      setVerifying(true);
      setError(null);

      const response = await api.post('/api/auth/verify-email', {
        token,
      });

      if (response && (response as any).success) {
        setSuccess(true);
        notify.success('Email verified and linked successfully!');
        // Refresh user data to get updated email
        if (refreshUser) {
          await refreshUser();
        }
        // Redirect to settings after a short delay
        setTimeout(() => {
          router.push('/settings');
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to verify email';
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-surface-base">
        <Navbar />
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="bg-surface-raised border border-border-default rounded-lg p-6 text-center">
              <h2 className="text-2xl font-bold text-text-primary mb-2">Invalid Token</h2>
              <p className="text-text-secondary mb-4">
                The verification link is invalid or missing a token.
              </p>
              <Link
                href="/settings"
                className="text-primary-500 hover:text-primary-400 font-medium"
              >
                Go to Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
              Verify Email Address
            </h2>
            <p className="mt-2 text-center text-sm text-text-secondary">
              Verifying your email address...
            </p>
          </div>

          {success ? (
            <div className="bg-surface-raised border border-border-default rounded-lg p-6 text-center">
              <div className="text-4xl mb-4 text-green-400">✓</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Email Verified Successfully
              </h3>
              <p className="text-text-secondary mb-4">
                Your email address has been verified and linked to your account successfully.
              </p>
              <p className="text-sm text-text-muted mb-4">
                Redirecting to settings...
              </p>
              <Link
                href="/settings"
                className="text-primary-500 hover:text-primary-400 font-medium"
              >
                Go to Settings
              </Link>
            </div>
          ) : error ? (
            <div className="bg-surface-raised border border-red-500/50 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4 text-red-400">✗</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Verification Failed
              </h3>
              <p className="text-text-secondary mb-4">
                {error}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleVerify}
                  variant="primary"
                  loading={verifying}
                  disabled={verifying}
                >
                  Try Again
                </Button>
                <Link
                  href="/settings"
                  className="text-primary-500 hover:text-primary-400 font-medium text-sm"
                >
                  Go to Settings
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-surface-raised border border-border-default rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-text-secondary">
                Verifying your email address...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

