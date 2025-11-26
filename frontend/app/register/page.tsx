'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { registerSchema } from '@/lib/validation';
import Button from '@/components/Button';
import { notify } from '@/lib/toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with Zod
    const result = registerSchema.safeParse({ email, password });
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

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match" });
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      notify.success('Account created successfully!');
    } catch (err: any) {
      notify.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-[#1a1a1a] border border-[#505050] rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Create Account
            </h1>
            <p className="text-[#a0a0a0]">Start building your store today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#a0a0a0] mb-2"
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
                  const result = registerSchema.safeParse({ email, password });
                  if (!result.success) {
                    const emailError = result.error.issues.find((e) => e.path[0] === 'email');
                    if (emailError) setErrors({ ...errors, email: emailError.message });
                  }
                }}
                className={`w-full px-4 py-2 bg-[#0a0a0a] text-white border rounded-lg focus:ring-2 focus:ring-[#808080] focus:border-[#808080] ${
                  errors.email ? 'border-red-500' : 'border-[#505050]'
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
                className="block text-sm font-medium text-[#a0a0a0] mb-2"
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
                  const result = registerSchema.safeParse({ email, password });
                  if (!result.success) {
                    const passwordError = result.error.issues.find((e) => e.path[0] === 'password');
                    if (passwordError) setErrors({ ...errors, password: passwordError.message });
                  }
                }}
                className={`w-full px-4 py-2 bg-[#0a0a0a] text-white border rounded-lg focus:ring-2 focus:ring-[#808080] focus:border-[#808080] ${
                  errors.password ? 'border-red-500' : 'border-[#505050]'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[#a0a0a0] mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                }}
                className={`w-full px-4 py-2 bg-[#0a0a0a] text-white border rounded-lg focus:ring-2 focus:ring-[#808080] focus:border-[#808080] ${
                  errors.confirmPassword ? 'border-red-500' : 'border-[#505050]'
                }`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-[#a0a0a0]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-white hover:text-[#e0e0e0] font-semibold"
            >
              Sign in
            </Link>
          </p>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-[#808080] hover:text-[#a0a0a0]"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

