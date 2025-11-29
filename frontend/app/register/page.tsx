'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { registerSchema } from '@/lib/validation';
import Button from '@/components/Button';
import { notify } from '@/lib/toast';

export default function RegisterPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Determine if identifier is email or mobile
    const isEmail = identifier.includes('@');
    const isMobile = /^\+?[1-9]\d{1,14}$/.test(identifier.replace(/\s/g, ''));

    if (!isEmail && !isMobile) {
      setErrors({ identifier: 'Please enter a valid email or mobile number' });
      return;
    }

    // Validate with Zod
    const registerData = isEmail ? { email: identifier, password } : { mobile: identifier.replace(/\s/g, ''), password };
    const result = registerSchema.safeParse(registerData);
    if (!result.success) {
      const fieldErrors: { identifier?: string; password?: string } = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        if (field === 'email' || field === 'mobile') {
          fieldErrors.identifier = err.message;
        } else {
          fieldErrors[field as keyof typeof fieldErrors] = err.message;
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
      await register(isEmail ? identifier : undefined, isEmail ? undefined : identifier.replace(/\s/g, ''), password);
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
        <div className="bg-[#1a1a1a] border border-[#505050] rounded-xl shadow-lg p-4 md:p-6 lg:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Create Account
            </h1>
            <p className="text-[#a0a0a0]">Start building your store today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-[#a0a0a0] mb-2"
              >
                Email or Mobile Number
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errors.identifier) setErrors({ ...errors, identifier: undefined });
                }}
                className={`w-full px-4 py-3 bg-[#0a0a0a] text-white border rounded-lg focus:ring-2 focus:ring-[#808080] focus:border-[#808080] min-h-[44px] ${
                  errors.identifier ? 'border-red-500' : 'border-[#505050]'
                }`}
                placeholder="you@example.com or +1234567890"
              />
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-400">{errors.identifier}</p>
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
                className={`w-full px-4 py-3 bg-[#0a0a0a] text-white border rounded-lg focus:ring-2 focus:ring-[#808080] focus:border-[#808080] min-h-[44px] ${
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
                className={`w-full px-4 py-3 bg-[#0a0a0a] text-white border rounded-lg focus:ring-2 focus:ring-[#808080] focus:border-[#808080] min-h-[44px] ${
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
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

