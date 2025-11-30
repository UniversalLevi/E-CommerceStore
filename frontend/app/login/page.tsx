'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema } from '@/lib/validation';
import Button from '@/components/Button';
import { notify } from '@/lib/toast';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

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
    const loginData = isEmail ? { email: identifier, password } : { mobile: identifier.replace(/\s/g, ''), password };
    const result = loginSchema.safeParse(loginData);
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

    setLoading(true);

    try {
      await login(identifier.replace(/\s/g, ''), password, !isEmail);
      notify.success('Login successful!');
      // Redirect is handled by AuthContext
    } catch (err: any) {
      notify.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 relative overflow-hidden">
      {/* Radial Glow Background */}
      <div className="absolute inset-0 bg-radial-glow-purple opacity-40"></div>
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-20"></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="glass-card border border-white/10 rounded-2xl shadow-2xl p-4 md:p-6 lg:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-purple mb-2">
              Welcome Back
            </h1>
            <p className="text-text-secondary">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-text-secondary mb-2"
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
                className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm text-text-primary placeholder:text-text-muted border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none min-h-[44px] transition-all ${
                  errors.identifier ? 'border-red-500' : 'border-white/10'
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
                  if (!password) return;
                  
                  // Determine if identifier is email or mobile
                  const isEmail = identifier.includes('@');
                  const loginData = isEmail 
                    ? { email: identifier, password } 
                    : { mobile: identifier.replace(/\s/g, ''), password };
                  
                  const result = loginSchema.safeParse(loginData);
                  if (!result.success && result.error?.issues) {
                    const passwordError = result.error.issues.find((e) => e.path[0] === 'password');
                    if (passwordError) setErrors({ ...errors, password: passwordError.message });
                  }
                }}
                className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm text-text-primary placeholder:text-text-muted border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none min-h-[44px] transition-all ${
                  errors.password ? 'border-red-500' : 'border-white/10'
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
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

