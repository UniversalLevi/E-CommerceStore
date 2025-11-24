'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      notify.error('Invalid reset token');
      router.push('/forgot-password');
    }
  }, [token, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!token) {
      notify.error('Invalid reset token');
      return;
    }

    try {
      const validated = resetPasswordSchema.parse({ password, confirmPassword });
      setSubmitting(true);

      await api.post('/api/auth/reset-password', {
        token,
        password: validated.password,
      });

      setSuccess(true);
      notify.success('Password reset successfully! You can now log in with your new password.');
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0].toString()] = error.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        notify.error(err.response?.data?.error || 'Failed to reset password');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Reset Password
            </h2>
            <p className="mt-2 text-center text-sm text-[#a0a0a0]">
              Enter your new password below.
            </p>
          </div>

          {success ? (
            <div className="bg-[#1a1a1a] border border-[#505050] rounded-lg p-6 text-center">
              <div className="text-4xl mb-4 text-white">✓</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Password Reset Successful
              </h3>
              <p className="text-[#a0a0a0] mb-4">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <Link
                href="/login"
                className="text-white hover:text-[#e0e0e0] font-medium"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#a0a0a0] mb-2">
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors({ ...errors, password: '' });
                    }
                  }}
                  className={`appearance-none relative block w-full px-3 py-2 bg-[#0a0a0a] text-white border ${
                    errors.password ? 'border-red-500' : 'border-[#505050]'
                  } placeholder-[#808080] rounded-lg focus:outline-none focus:ring-[#808080] focus:border-[#808080] focus:z-10 sm:text-sm`}
                  placeholder="Enter new password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#a0a0a0] mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: '' });
                    }
                  }}
                  className={`appearance-none relative block w-full px-3 py-2 bg-[#0a0a0a] text-white border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-[#505050]'
                  } placeholder-[#808080] rounded-lg focus:outline-none focus:ring-[#808080] focus:border-[#808080] focus:z-10 sm:text-sm`}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  loading={submitting}
                  disabled={submitting}
                >
                  Reset Password
                </Button>
              </div>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-white hover:text-[#e0e0e0] font-medium"
                >
                  ← Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

