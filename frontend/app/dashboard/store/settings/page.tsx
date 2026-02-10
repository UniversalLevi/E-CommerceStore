'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useStore } from '@/contexts/StoreContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Settings, Loader2, ExternalLink, AlertCircle, CheckCircle2, XCircle, Mail, CreditCard, Store as StoreIcon, Palette, Eye } from 'lucide-react';
// Removed getAvailableThemes import - now fetching from API

export default function StoreSettingsPage() {
  const { store, refreshStore } = useStore();
  const [razorpayStatus, setRazorpayStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [updatingTestMode, setUpdatingTestMode] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAccountId, setManualAccountId] = useState('');
  const [settingAccount, setSettingAccount] = useState(false);
  const [availableThemes, setAvailableThemes] = useState<any[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [updatingTheme, setUpdatingTheme] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  const fetchRazorpayStatus = useCallback(async () => {
    try {
      setLoading(true);
      if (store) {
        const statusResponse = await api.getRazorpayStatus(store._id);
        if (statusResponse.success) {
          setRazorpayStatus(statusResponse.data);
        }
      }
    } catch (error: any) {
      console.error('Error fetching Razorpay status:', error);
    } finally {
      setLoading(false);
    }
  }, [store]);

  const fetchAvailableThemes = useCallback(async () => {
    if (!store) return;
    
    try {
      // Fetch themes from store dashboard API (only active templates from database)
      const response = await api.get<{ success: boolean; data: any[] }>('/api/store-dashboard/themes');
      if (response.success) {
        const themes = response.data || [];
        setAvailableThemes(themes);
        
        // Set current theme if it exists in available themes
        if (store?.settings?.theme?.name) {
          const currentThemeExists = themes.some(t => t.name === store.settings.theme.name);
          if (currentThemeExists) {
            setSelectedTheme(store.settings.theme.name);
          } else {
            setSelectedTheme(''); // Clear selection if current theme is not available
          }
        } else {
          setSelectedTheme(''); // No default theme
        }
      } else {
        // No fallback - show empty list
        setAvailableThemes([]);
        setSelectedTheme('');
      }
    } catch (error) {
      console.error('Error fetching themes:', error);
      // No fallback - show empty list
      setAvailableThemes([]);
      setSelectedTheme('');
    }
  }, [store]);

  useEffect(() => {
    if (store) {
      fetchRazorpayStatus();
      // Fetch available themes (only active templates from database)
      fetchAvailableThemes();
    }
  }, [store, fetchRazorpayStatus, fetchAvailableThemes]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('razorpay') === 'connected') {
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => {
        fetchRazorpayStatus();
        refreshStore();
        notify.success('Checking Razorpay connection status...');
      }, 2000);
    }
  }, [fetchRazorpayStatus, refreshStore]);

  const handleConnectRazorpay = async () => {
    if (!store) return;
    try {
      setConnecting(true);
      const response = await api.initiateRazorpayConnect(store._id);
      if (response.success && response.data.onboardingUrl) {
        window.open(response.data.onboardingUrl, '_blank');
        notify.success('Redirecting to Razorpay onboarding...');
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to initiate Razorpay connection');
    } finally {
      setConnecting(false);
    }
  };

  const handleToggleTestMode = async () => {
    if (!store) return;
    try {
      setUpdatingTestMode(true);
      const newTestMode = !store.settings?.testMode;
      const response = await api.updateStore(store._id, {
        settings: {
          ...store.settings,
          testMode: newTestMode,
          emailNotifications: store.settings?.emailNotifications || {},
        },
      });
      if (response.success) {
        refreshStore();
        notify.success(`Test mode ${newTestMode ? 'enabled' : 'disabled'}`);
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to update test mode');
    } finally {
      setUpdatingTestMode(false);
    }
  };

  const handleSetAccountId = async () => {
    if (!store) return;
    if (!manualAccountId.trim()) {
      notify.error('Please enter a valid account ID');
      return;
    }

    try {
      setSettingAccount(true);
      const response = await api.setRazorpayAccount(store._id, manualAccountId.trim());
      if (response.success) {
        setShowManualInput(false);
        setManualAccountId('');
        await fetchRazorpayStatus();
        await refreshStore();
        notify.success('Razorpay account ID set successfully');
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to set account ID');
    } finally {
      setSettingAccount(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Connected
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-500/20 text-yellow-400">
            <AlertCircle className="h-4 w-4" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400">
            <XCircle className="h-4 w-4" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-500/20 text-gray-400">
            Not Connected
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!store) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Store Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure your store preferences and payment settings</p>
      </div>

      {/* Store Information */}
      <div className="bg-surface-raised rounded-xl border border-border-default p-6 space-y-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <StoreIcon className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Store Information</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Store Name</label>
            <input
              type="text"
              value={store.name}
              disabled
              className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary opacity-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Store Slug</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={store.slug}
                disabled
                className="flex-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary opacity-50 cursor-not-allowed"
              />
              <div className="flex gap-2">
                <a
                  href={`/storefront/${store.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit Store (Path)
                </a>
                <a
                  href={`https://${store.slug}.eazyds.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit Store (Subdomain)
                </a>
              </div>
            </div>
            <p className="mt-1 text-sm text-text-secondary">Slug cannot be changed after creation</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Currency</label>
            <input
              type="text"
              value={store.currency}
              disabled
              className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary opacity-50 cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-text-secondary">Currency cannot be changed after creation</p>
          </div>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-surface-raised rounded-xl border border-border-default p-6 space-y-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Payment Settings</h2>
        </div>
        <div className="space-y-6">
          {/* Test Mode Toggle */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20 p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-text-primary">Test Mode</h3>
                  {store.settings?.testMode && (
                    <span className="px-2.5 py-1 bg-yellow-500/30 text-yellow-300 text-xs font-medium rounded-full border border-yellow-500/50">TESTING</span>
                  )}
                </div>
                <p className="text-sm text-text-secondary">
                  Enable test mode to test the order flow without connecting a real Razorpay account. 
                  Payments will be automatically approved in test mode.
                </p>
              </div>
              <button
                onClick={handleToggleTestMode}
                disabled={updatingTestMode}
                className={`ml-4 relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  store.settings?.testMode ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-lg ${
                    store.settings?.testMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Razorpay Account */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-text-primary mb-1">Razorpay Account</p>
                <p className="text-sm text-text-secondary">
                  Connect your Razorpay account to accept real payments
                </p>
              </div>
              {getStatusBadge(razorpayStatus?.accountStatus || 'not_connected')}
            </div>

            {razorpayStatus?.accountStatus !== 'active' && (
              <div className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleConnectRazorpay}
                    disabled={connecting || store.settings?.testMode}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-5 w-5" />
                        Open Razorpay Dashboard
                      </>
                    )}
                  </button>
                  {(razorpayStatus?.accountStatus === 'pending' || razorpayStatus?.accountStatus === 'not_connected') && (
                    <>
                      <button
                        onClick={fetchRazorpayStatus}
                        disabled={loading}
                        className="px-4 py-3 bg-surface-base border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <Settings className="h-5 w-5" />
                            Check Status
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowManualInput(!showManualInput)}
                        className="px-4 py-3 bg-surface-base border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition-all font-medium flex items-center gap-2"
                      >
                        Enter Account ID Manually
                      </button>
                    </>
                  )}
                </div>

                {showManualInput && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Razorpay Account ID
                      </label>
                      <input
                        type="text"
                        value={manualAccountId}
                        onChange={(e) => setManualAccountId(e.target.value)}
                        placeholder="acc_xxxxxxxxxxxxx"
                        className="w-full px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="mt-1 text-xs text-text-secondary">
                        After completing onboarding on Razorpay, find your Account ID in the Razorpay dashboard and enter it here.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSetAccountId}
                        disabled={settingAccount || !manualAccountId.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {settingAccount ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Setting...
                          </>
                        ) : (
                          'Set Account ID'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowManualInput(false);
                          setManualAccountId('');
                        }}
                        className="px-4 py-2 bg-surface-base border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition-all font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {razorpayStatus?.accountStatus === 'pending' && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-400 mb-2">
                  <strong>Onboarding in progress:</strong> Complete the following steps:
                </p>
                <ol className="text-xs text-blue-300 list-decimal list-inside space-y-1">
                  <li>Click "Open Razorpay Dashboard" to go to Razorpay Connect setup</li>
                  <li>Complete the onboarding process on Razorpay's website</li>
                  <li>Find your Account ID (starts with "acc_") in the Razorpay dashboard</li>
                  <li>Click "Enter Account ID Manually" and paste your Account ID</li>
                  <li>Click "Set Account ID" to complete the connection</li>
                </ol>
              </div>
            )}

            {razorpayStatus?.accountStatus === 'active' && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mt-4">
                <p className="text-sm text-green-400">
                  Your Razorpay account is connected. Payments will go directly to your account.
                </p>
              </div>
            )}

            {store.settings?.testMode && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-400">
                  Test mode is enabled. Real payments are disabled. Disable test mode to accept real payments.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Theme & Appearance */}
      <div className="bg-surface-raised rounded-xl border border-border-default p-6 space-y-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Theme & Appearance</h2>
        </div>
        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <p className="text-sm font-medium text-text-primary mb-4">Select Store Theme</p>
            {availableThemes.length === 0 ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 text-center">
                <p className="text-yellow-400 mb-2">No themes available</p>
                <p className="text-sm text-text-secondary">
                  Please create and activate templates in the{' '}
                  <Link href="/admin/templates" className="text-primary-500 hover:underline">
                    Templates section
                  </Link>
                  {' '}to use them here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availableThemes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => {
                    setPreviewTheme(theme.name);
                    setSelectedTheme(theme.name);
                  }}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    selectedTheme === theme.name
                      ? 'border-purple-500 shadow-lg shadow-purple-500/25'
                      : 'border-border-default hover:border-purple-500/50'
                  }`}
                >
                  {selectedTheme === theme.name && (
                    <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full p-1">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className="w-full h-24 rounded-lg mb-3 flex items-center justify-center text-white font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${theme.defaultColors.primary} 0%, ${theme.defaultColors.accent} 100%)`,
                    }}
                  >
                    {theme.displayName}
                  </div>
                  <p className="text-xs font-medium text-text-primary text-center">{theme.displayName}</p>
                  <p className="text-xs text-text-secondary text-center mt-1">{theme.category}</p>
                </button>
              ))}
              </div>
            )}
          </div>

          {/* Apply Theme Button */}
          {selectedTheme && selectedTheme !== store.settings?.theme?.name && availableThemes.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    setUpdatingTheme(true);
                    const response = await api.updateStoreTheme(store._id, {
                      name: selectedTheme,
                      customizations: {},
                    });
                    if (response.success) {
                      await refreshStore();
                      notify.success('Theme applied successfully! Please refresh the storefront page to see changes.');
                      setPreviewTheme(null);
                      // Small delay to ensure backend has saved
                      setTimeout(() => {
                        window.open(`/storefront/${store.slug}`, '_blank');
                      }, 300);
                    } else {
                      notify.error('Failed to apply theme');
                    }
                  } catch (error: any) {
                    console.error('Theme update error:', error);
                    notify.error(error.response?.data?.message || 'Failed to apply theme');
                  } finally {
                    setUpdatingTheme(false);
                  }
                }}
                disabled={updatingTheme}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updatingTheme ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    Apply Theme
                  </>
                )}
              </button>
              {previewTheme && (
                <a
                  href={`/storefront/${store.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-surface-base border border-border-default text-text-primary rounded-lg hover:bg-surface-hover transition-all font-medium flex items-center gap-2"
                >
                  <ExternalLink className="h-5 w-5" />
                  Preview Store
                </a>
              )}
            </div>
          )}

          {/* Current Theme Info */}
          {store.settings?.theme && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                <strong>Current Theme:</strong> {availableThemes.find((t) => t.name === store.settings.theme.name)?.displayName || store.settings.theme.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-surface-raised rounded-xl border border-border-default p-6 space-y-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Email Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">Order Confirmation (Customer)</p>
              <p className="text-sm text-text-secondary">Send confirmation emails to customers when they place an order</p>
            </div>
            <button
              onClick={async () => {
                const current = store.settings?.emailNotifications?.orderConfirmation !== false;
                const newValue = !current;
                try {
                  const response = await api.updateStore(store._id, {
                    settings: {
                      ...store.settings,
                      emailNotifications: {
                        ...(store.settings?.emailNotifications || {}),
                        orderConfirmation: newValue,
                      },
                    },
                  });
                  if (response.success) {
                    refreshStore();
                    notify.success(`Order confirmation emails ${newValue ? 'enabled' : 'disabled'}`);
                  }
                } catch (error: any) {
                  notify.error('Failed to update email settings');
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                store.settings?.emailNotifications?.orderConfirmation !== false
                  ? 'bg-purple-600'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  store.settings?.emailNotifications?.orderConfirmation !== false
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">New Order Notification (Owner)</p>
              <p className="text-sm text-text-secondary">Receive email notifications when a new order is placed</p>
            </div>
            <button
              onClick={async () => {
                const current = store.settings?.emailNotifications?.newOrderNotification !== false;
                const newValue = !current;
                try {
                  const response = await api.updateStore(store._id, {
                    settings: {
                      ...store.settings,
                      emailNotifications: {
                        ...(store.settings?.emailNotifications || {}),
                        newOrderNotification: newValue,
                      },
                    },
                  });
                  if (response.success) {
                    refreshStore();
                    notify.success(`New order notifications ${newValue ? 'enabled' : 'disabled'}`);
                  }
                } catch (error: any) {
                  notify.error('Failed to update email settings');
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                store.settings?.emailNotifications?.newOrderNotification !== false
                  ? 'bg-purple-600'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  store.settings?.emailNotifications?.newOrderNotification !== false
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">Payment Status Updates</p>
              <p className="text-sm text-text-secondary">Send emails to customers when payment status changes</p>
            </div>
            <button
              onClick={async () => {
                const current = store.settings?.emailNotifications?.paymentStatus !== false;
                const newValue = !current;
                try {
                  const response = await api.updateStore(store._id, {
                    settings: {
                      ...store.settings,
                      emailNotifications: {
                        ...(store.settings?.emailNotifications || {}),
                        paymentStatus: newValue,
                      },
                    },
                  });
                  if (response.success) {
                    refreshStore();
                    notify.success(`Payment status emails ${newValue ? 'enabled' : 'disabled'}`);
                  }
                } catch (error: any) {
                  notify.error('Failed to update email settings');
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                store.settings?.emailNotifications?.paymentStatus !== false
                  ? 'bg-purple-600'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  store.settings?.emailNotifications?.paymentStatus !== false
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">Fulfillment Status Updates</p>
              <p className="text-sm text-text-secondary">Send emails to customers when fulfillment status changes</p>
            </div>
            <button
              onClick={async () => {
                const current = store.settings?.emailNotifications?.fulfillmentStatus !== false;
                const newValue = !current;
                try {
                  const response = await api.updateStore(store._id, {
                    settings: {
                      ...store.settings,
                      emailNotifications: {
                        ...(store.settings?.emailNotifications || {}),
                        fulfillmentStatus: newValue,
                      },
                    },
                  });
                  if (response.success) {
                    refreshStore();
                    notify.success(`Fulfillment status emails ${newValue ? 'enabled' : 'disabled'}`);
                  }
                } catch (error: any) {
                  notify.error('Failed to update email settings');
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                store.settings?.emailNotifications?.fulfillmentStatus !== false
                  ? 'bg-purple-600'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  store.settings?.emailNotifications?.fulfillmentStatus !== false
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
