'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = forgotPasswordSchema.parse({ email });
      setSubmitting(true);

      await api.post('/api/auth/forgot-password', validated);

      setSuccess(true);
      notify.success('If an account with that email exists, a password reset link has been sent.');
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
        notify.error(err.response?.data?.error || 'Failed to send reset email');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Forgot Password
            </h2>
            <p className="mt-2 text-center text-sm text-[#a0a0a0]">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {success ? (
            <div className="bg-[#1a1a1a] border border-[#505050] rounded-lg p-6 text-center">
              <div className="text-4xl mb-4 text-white">✓</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Check Your Email
              </h3>
              <p className="text-[#a0a0a0] mb-4">
                If an account with that email exists, we've sent a password reset link.
              </p>
              <Link
                href="/login"
                className="text-white hover:text-[#e0e0e0] font-medium"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#a0a0a0] mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors({ ...errors, email: '' });
                    }
                  }}
                  className={`appearance-none relative block w-full px-3 py-2 bg-[#0a0a0a] text-white border ${
                    errors.email ? 'border-red-500' : 'border-[#505050]'
                  } placeholder-[#808080] rounded-lg focus:outline-none focus:ring-[#808080] focus:border-[#808080] focus:z-10 sm:text-sm`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  loading={submitting}
                  disabled={submitting}
                >
                  Send Reset Link
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

