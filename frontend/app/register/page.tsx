'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { registerSchema } from '@/lib/validation';
import Button from '@/components/Button';
import { notify } from '@/lib/toast';
import { UNIQUE_COUNTRIES } from '@/lib/countries';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; country?: string; password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  // Extract referral code from URL on mount
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

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
      await register(email, cleanPhone, password, name, country, referralCode || undefined);
      notify.success('Account created successfully!');
    } catch (err: any) {
      notify.error(err.message || 'Registration failed');
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
              Create Account
            </h1>
            <p className="text-text-secondary">Start building your store today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-text-secondary mb-2"
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
                className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm text-text-primary border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none min-h-[44px] transition-all ${
                  errors.name ? 'border-red-500' : 'border-white/10'
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
                className="block text-sm font-medium text-text-secondary mb-2"
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
                className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm text-text-primary border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none min-h-[44px] transition-all ${
                  errors.email ? 'border-red-500' : 'border-white/10'
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
                className="block text-sm font-medium text-text-secondary mb-2"
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
                className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm text-text-primary border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none min-h-[44px] transition-all ${
                  errors.phone ? 'border-red-500' : 'border-white/10'
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
                className="block text-sm font-medium text-text-secondary mb-2"
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
                className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm text-text-primary border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none min-h-[44px] transition-all ${
                  errors.country ? 'border-red-500' : 'border-white/10'
                }`}
              >
                <option value="">Select a country</option>
                {UNIQUE_COUNTRIES.map((c) => (
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
                className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm text-text-primary border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none min-h-[44px] transition-all ${
                  errors.password ? 'border-red-500' : 'border-white/10'
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
                className="block text-sm font-medium text-text-secondary mb-2"
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
                className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm text-text-primary border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none min-h-[44px] transition-all ${
                  errors.confirmPassword ? 'border-red-500' : 'border-white/10'
                }`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="referralCode"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Referral Code (Optional)
              </label>
              <input
                id="referralCode"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm text-text-primary border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none min-h-[44px] transition-all"
                placeholder="Enter referral code"
              />
              <p className="mt-1 text-xs text-text-secondary">
                Have a referral code? Enter it here to support your referrer
              </p>
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

