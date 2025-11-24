'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { passwordChangeSchema } from '@/lib/validation';
import Button from '@/components/Button';
import ConfirmModal from '@/components/ConfirmModal';

export default function SettingsPage() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Password change form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});

    // Validate with Zod
    const result = passwordChangeSchema.safeParse(passwordData);
    if (!result.success) {
      const fieldErrors: any = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setPasswordErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      await api.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      notify.success('Password changed successfully. Please log in again.');
      setTimeout(() => {
        logout();
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/api/auth/account');
      notify.success('Account deleted successfully');
      setTimeout(() => {
        logout();
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to delete account');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Navigation */}
      <nav className="bg-surface-raised border-b border-border-default shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-500">
              Auto Shopify Store Builder
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-text-secondary hover:text-primary-500">
                Dashboard
              </Link>
              <Link href="/products" className="text-text-secondary hover:text-primary-500">
                Products
              </Link>
              <span className="text-text-secondary">{user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-8">Settings</h1>

          {/* Profile Info */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary">Email</label>
                <p className="mt-1 text-sm text-text-primary">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">Role</label>
                <span
                  className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    user?.role === 'admin'
                      ? 'bg-primary-500/20 text-primary-500 border border-primary-500/50'
                      : 'bg-accent-500/20 text-accent-400 border border-accent-500/50'
                  }`}
                >
                  {user?.role?.toUpperCase()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">Account Created</label>
                <p className="mt-1 text-sm text-text-primary">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              {user?.lastLogin && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary">Last Login</label>
                  <p className="mt-1 text-sm text-text-primary">
                    {new Date(user.lastLogin).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, currentPassword: e.target.value });
                    if (passwordErrors.currentPassword)
                      setPasswordErrors({ ...passwordErrors, currentPassword: undefined });
                  }}
                  className={`w-full px-4 py-2 bg-surface-elevated border rounded-lg text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    passwordErrors.currentPassword ? 'border-red-500' : 'border-border-default'
                  }`}
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-400">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, newPassword: e.target.value });
                    if (passwordErrors.newPassword)
                      setPasswordErrors({ ...passwordErrors, newPassword: undefined });
                  }}
                  className={`w-full px-4 py-2 bg-surface-elevated border rounded-lg text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    passwordErrors.newPassword ? 'border-red-500' : 'border-border-default'
                  }`}
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-400">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                    if (passwordErrors.confirmPassword)
                      setPasswordErrors({ ...passwordErrors, confirmPassword: undefined });
                  }}
                  className={`w-full px-4 py-2 bg-surface-elevated border rounded-lg text-text-primary focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    passwordErrors.confirmPassword ? 'border-red-500' : 'border-border-default'
                  }`}
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" loading={loading}>
                Change Password
              </Button>
            </form>
          </div>

          {/* Account Deletion */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Danger Zone</h2>
            <div className="border-t border-border-default pt-4">
              <p className="text-sm text-text-secondary mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button
                variant="danger"
                onClick={() => setDeleteModalOpen(true)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and will delete all your stores and data."
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}

