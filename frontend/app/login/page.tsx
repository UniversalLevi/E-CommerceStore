'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema } from '@/lib/validation';
import Button from '@/components/Button';
import { notify } from '@/lib/toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with Zod
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      notify.success('Login successful!');
      // Redirect is handled by AuthContext
    } catch (err: any) {
      notify.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Welcome Back
            </h1>
            <p className="text-text-secondary">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                onBlur={() => {
                  const result = loginSchema.safeParse({ email, password });
                  if (!result.success && result.error?.issues) {
                    const emailError = result.error.issues.find((e) => e.path[0] === 'email');
                    if (emailError) setErrors({ ...errors, email: emailError.message });
                  }
                }}
                className={`w-full px-4 py-2 bg-surface-elevated text-text-primary border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.email ? 'border-red-500' : 'border-border-default'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                onBlur={() => {
                  const result = loginSchema.safeParse({ email, password });
                  if (!result.success && result.error?.issues) {
                    const passwordError = result.error.issues.find((e) => e.path[0] === 'password');
                    if (passwordError) setErrors({ ...errors, password: passwordError.message });
                  }
                }}
                className={`w-full px-4 py-2 bg-surface-elevated text-text-primary border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.password ? 'border-red-500' : 'border-border-default'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/forgot-password"
                className="text-sm text-text-primary hover:text-primary-500"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-text-secondary">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="text-text-primary hover:text-primary-500 font-semibold"
            >
              Sign up
            </Link>
          </p>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-text-muted hover:text-text-tertiary"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

