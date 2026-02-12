'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Settings, Loader2, ExternalLink, AlertCircle, CheckCircle2, XCircle, CreditCard } from 'lucide-react';

export default function StorePaymentPage() {
  const { store, refreshStore } = useStore();
  const [razorpayStatus, setRazorpayStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [updatingTestMode, setUpdatingTestMode] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAccountId, setManualAccountId] = useState('');
  const [settingAccount, setSettingAccount] = useState(false);

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

  useEffect(() => {
    if (store) {
      fetchRazorpayStatus();
    }
  }, [store, fetchRazorpayStatus]);

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
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Payment Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure payment methods and Razorpay connection</p>
      </div>

      <div className="bg-surface-raised rounded-xl border border-border-default p-6 space-y-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Payment Settings</h2>
        </div>
        <div className="space-y-6">
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
    </div>
  );
}
