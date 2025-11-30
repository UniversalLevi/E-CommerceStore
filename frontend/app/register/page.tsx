'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { registerSchema } from '@/lib/validation';
import Button from '@/components/Button';
import { notify } from '@/lib/toast';
import { COUNTRIES } from '@/lib/countries';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; country?: string; password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    if (!name.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }

    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!phone.trim()) {
      setErrors({ phone: 'Phone number is required' });
      return;
    }

    if (!country.trim()) {
      setErrors({ country: 'Country is required' });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    // Validate phone format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = phone.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      setErrors({ phone: 'Please enter a valid phone number (e.g., +1234567890)' });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match" });
      return;
    }

    // Validate with Zod
    const registerData = { email, mobile: cleanPhone, password, name, country };
    const result = registerSchema.safeParse(registerData);
    if (!result.success) {
      const fieldErrors: { email?: string; phone?: string; password?: string } = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        if (field === 'mobile') {
          fieldErrors.phone = err.message;
        } else {
          fieldErrors[field as keyof typeof fieldErrors] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      await register(email, cleanPhone, password, name, country);
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
                htmlFor="name"
                className="block text-sm font-medium text-[#a0a0a0] mb-2"
              >
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                required
                className={`w-full px-4 py-3 bg-[#0a0a0a] text-white border rounded-lg focus:ring-2 focus:ring-[#808080] focus:border-[#808080] min-h-[44px] ${
                  errors.name ? 'border-red-500' : 'border-[#505050]'
                }`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#a0a0a0] mb-2"
              >
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                required
                className={`w-full px-4 py-3 bg-[#0a0a0a] text-white border rounded-lg focus:ring-2 focus:ring-[#808080] focus:border-[#808080] min-h-[44px] ${
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
                htmlFor="phone"
                className="block text-sm font-medium text-[#a0a0a0] mb-2"
              >
                Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                }}
                required
                className={`w-full px-4 py-3 bg-[#0a0a0a] text-white border rounded-lg focus:ring-2 focus:ring-[#808080] focus:border-[#808080] min-h-[44px] ${
                  errors.phone ? 'border-red-500' : 'border-[#505050]'
                }`}
                placeholder="+1234567890"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-[#a0a0a0] mb-2"
              >
                Country *
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  if (errors.country) setErrors({ ...errors, country: undefined });
                }}
                required
                className={`w-full px-4 py-3 bg-[#0a0a0a] text-white border rounded-lg focus:ring-2 focus:ring-[#808080] focus:border-[#808080] min-h-[44px] ${
                  errors.country ? 'border-red-500' : 'border-[#505050]'
                }`}
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p className="mt-1 text-sm text-red-400">{errors.country}</p>
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

