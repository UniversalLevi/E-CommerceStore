'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import LoadingScreen from '@/components/LoadingScreen';
import {
  Mail,
  Send,
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  Store,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

interface StoreConnection {
  _id: string;
  storeName: string;
  shopDomain: string;
  status: string;
}

interface CustomerStats {
  total: number;
  withEmail: number;
  withPhone: number;
  acceptsMarketing: number;
  totalSpent: number;
  totalOrders: number;
}

export default function CustomersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreConnection[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showStoreSelector, setShowStoreSelector] = useState(true);

  // Email sending state
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedSmtpAccount, setSelectedSmtpAccount] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [sendSubject, setSendSubject] = useState('');
  const [sendHtmlContent, setSendHtmlContent] = useState('');
  const [acceptsMarketingOnly, setAcceptsMarketingOnly] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<any>(null);

  // SMTP and templates
  const [smtpAccounts, setSmtpAccounts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchStores(), fetchSmtpAccounts(), fetchTemplates()]);
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await api.get<{ success: boolean; data: StoreConnection[] }>('/api/stores');
      const activeStores = response.data.filter((s: StoreConnection) => s.status === 'active');
      setStores(activeStores);
      if (activeStores.length > 0 && selectedStores.length === 0) {
        setSelectedStores([activeStores[0]._id]);
      }
    } catch (error: any) {
      console.error('Failed to fetch stores:', error);
      notify.error('Failed to load stores');
    }
  };

  const fetchStats = async () => {
    if (selectedStores.length === 0) {
      setStats(null);
      return;
    }
    try {
      const storeId = selectedStores.length === 1 ? selectedStores[0] : undefined;
      const response = await api.getCustomerStats({ storeId });
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchSmtpAccounts = async () => {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>('/api/email-sender/smtp-accounts');
      setSmtpAccounts(response.data);
      if (response.data.length > 0 && !selectedSmtpAccount) {
        const defaultAccount = response.data.find((a: any) => a.isDefault) || response.data[0];
        setSelectedSmtpAccount(defaultAccount._id);
      }
    } catch (error: any) {
      console.error('Failed to fetch SMTP accounts:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>('/api/email-sender/templates');
      setTemplates(response.data);
      if (response.data.length > 0 && !selectedTemplate) {
        const defaultTemplate = response.data.find((t: any) => t.isDefault) || response.data[0];
        setSelectedTemplate(defaultTemplate._id);
        setSendSubject(defaultTemplate.subject);
        setSendHtmlContent(defaultTemplate.htmlContent);
      }
    } catch (error: any) {
      console.error('Failed to fetch templates:', error);
    }
  };

  useEffect(() => {
    if (selectedStores.length > 0) {
      fetchStats();
    } else {
      setStats(null);
    }
  }, [selectedStores]);

  const handleSyncCustomers = async (storeId: string) => {
    try {
      setSyncing(storeId);
      const response = await api.syncCustomers(storeId);
      notify.success(response.message);
      await fetchStats();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to sync customers');
    } finally {
      setSyncing(null);
    }
  };

  const handleSendEmails = async () => {
    if (selectedStores.length === 0) {
      notify.error('Please select at least one store');
      return;
    }

    if (!selectedSmtpAccount) {
      notify.error('Please select an SMTP account');
      return;
    }

    if (!sendSubject.trim() && !selectedTemplate) {
      notify.error('Please provide a subject or select a template');
      return;
    }

    if (!sendHtmlContent.trim() && !selectedTemplate) {
      notify.error('Please provide HTML content or select a template');
      return;
    }

    try {
      setSending(true);
      setSendResults(null);
      
      const response = await api.post<{
        success: boolean;
        data: {
          sent: number;
          failed: number;
          total: number;
          errors: Array<{ email: string; error: string }>;
        };
      }>('/api/email-sender/send-to-customers', {
        storeIds: selectedStores,
        subject: sendSubject.trim() || undefined,
        htmlContent: sendHtmlContent.trim() || undefined,
        smtpAccountId: selectedSmtpAccount || undefined,
        templateId: selectedTemplate || undefined,
        acceptsMarketingOnly,
      });

      if (response.success && response.data) {
        setSendResults(response.data);
        notify.success(`Sent ${response.data.sent} emails successfully`);

        if (response.data.failed > 0) {
          notify.warning(`${response.data.failed} emails failed to send`);
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Send email error:', error);
      notify.error(error.response?.data?.message || error.message || 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t._id === templateId);
    if (template) {
      setSendSubject(template.subject);
      setSendHtmlContent(template.htmlContent);
    } else {
      setSendSubject('');
      setSendHtmlContent('');
    }
  };

  const toggleStoreSelection = (storeId: string) => {
    if (selectedStores.includes(storeId)) {
      setSelectedStores(selectedStores.filter((id) => id !== storeId));
    } else {
      setSelectedStores([...selectedStores, storeId]);
    }
  };

  const selectAllStores = () => {
    setSelectedStores(stores.map((s) => s._id));
  };

  const deselectAllStores = () => {
    setSelectedStores([]);
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              My Customers
            </span>
          </h1>
          <p className="mt-2 text-text-secondary">Manage and email your Shopify customers</p>
        </div>
        <button
          onClick={() => {
            if (selectedStores.length === 0) {
              notify.error('Please select at least one store first');
              return;
            }
            setShowSendModal(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg hover:from-violet-600 hover:to-fuchsia-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <Send className="w-4 h-4" />
          Send Mass Email
        </button>
      </div>

      {/* Improved Store Selection */}
      {stores.length > 0 && (
        <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
          <button
            onClick={() => setShowStoreSelector(!showStoreSelector)}
            className="w-full p-4 flex items-center justify-between hover:bg-surface-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-violet-400" />
              <div className="text-left">
                <h2 className="text-lg font-semibold text-text-primary">Select Stores</h2>
                <p className="text-sm text-text-secondary">
                  {selectedStores.length === 0
                    ? 'No stores selected'
                    : `${selectedStores.length} of ${stores.length} stores selected`}
                </p>
              </div>
            </div>
            {showStoreSelector ? (
              <ChevronUp className="w-5 h-5 text-text-secondary" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-secondary" />
            )}
          </button>

          {showStoreSelector && (
            <div className="p-4 border-t border-border-default space-y-3">
              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={selectAllStores}
                  className="px-3 py-1.5 text-xs bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllStores}
                  className="px-3 py-1.5 text-xs bg-surface-elevated text-text-secondary rounded-lg hover:bg-surface-hover transition-colors"
                >
                  Deselect All
                </button>
              </div>

              {/* Store List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {stores.map((store) => {
                  const isSelected = selectedStores.includes(store._id);
                  return (
                    <div
                      key={store._id}
                      onClick={() => toggleStoreSelection(store._id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-border-default bg-surface-elevated hover:border-violet-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'border-violet-500 bg-violet-500'
                                  : 'border-text-muted'
                              }`}
                            >
                              {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <span className="font-semibold text-text-primary">{store.storeName}</span>
                          </div>
                          <p className="text-xs text-text-muted ml-7">{store.shopDomain}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSyncCustomers(store._id);
                          }}
                          disabled={syncing === store._id}
                          className="p-1.5 text-text-secondary hover:text-violet-400 transition-colors disabled:opacity-50"
                          title="Sync customers from Shopify"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${syncing === store._id ? 'animate-spin' : ''}`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-text-muted" />
              <p className="text-text-muted text-sm">Total Customers</p>
            </div>
            <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              <p className="text-text-muted text-sm">With Email</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.withEmail}</p>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-5 h-5 text-violet-400" />
              <p className="text-text-muted text-sm">Accepts Marketing</p>
            </div>
            <p className="text-2xl font-bold text-violet-400">{stats.acceptsMarketing}</p>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <p className="text-text-muted text-sm mb-2">Total Spent</p>
            <p className="text-2xl font-bold text-text-primary">
              ₹{stats.totalSpent.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <p className="text-text-muted text-sm mb-2">Total Orders</p>
            <p className="text-2xl font-bold text-text-primary">{stats.totalOrders}</p>
          </div>
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <p className="text-text-muted text-sm mb-2">With Phone</p>
            <p className="text-2xl font-bold text-text-primary">{stats.withPhone}</p>
          </div>
        </div>
      )}

      {stores.length === 0 && (
        <div className="text-center py-12 bg-surface-raised border border-border-default rounded-xl">
          <Store className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">No stores connected</p>
          <p className="text-text-muted text-sm mt-2">
            Connect a Shopify store to start syncing customers
          </p>
        </div>
      )}

      {selectedStores.length === 0 && stores.length > 0 && (
        <div className="text-center py-8 bg-surface-raised border border-border-default rounded-xl">
          <p className="text-text-secondary">Select at least one store to view customer statistics</p>
        </div>
      )}

      {/* Send Email Modal */}
      {showSendModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSendModal(false);
            }
          }}
        >
          <div className="bg-surface-raised border border-border-default rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Send Mass Email</h2>
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setSendResults(null);
                  }}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Selected Stores Info */}
                <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                  <p className="text-sm text-text-secondary mb-2">Sending to customers from:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStores.map((storeId) => {
                      const store = stores.find((s) => s._id === storeId);
                      return store ? (
                        <span
                          key={storeId}
                          className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-lg text-sm"
                        >
                          {store.storeName}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* SMTP Account */}
                {smtpAccounts.length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      SMTP Account <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={selectedSmtpAccount}
                      onChange={(e) => setSelectedSmtpAccount(e.target.value)}
                      className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">Select SMTP Account</option>
                      {smtpAccounts.map((account) => (
                        <option key={account._id} value={account._id}>
                          {account.name} ({account.email}) {account.isDefault && '(Default)'}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-yellow-400">
                      No SMTP accounts configured. Please configure an SMTP account first.
                    </p>
                  </div>
                )}

                {/* Template Selection */}
                {templates.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Email Template (Optional)
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                      className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">No Template (Use Custom Content)</option>
                      {templates.map((template) => (
                        <option key={template._id} value={template._id}>
                          {template.name} {template.isDefault && '(Default)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Subject {!selectedTemplate && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type="text"
                    value={sendSubject}
                    onChange={(e) => setSendSubject(e.target.value)}
                    placeholder="Email subject"
                    className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* HTML Content */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    HTML Content {!selectedTemplate && <span className="text-red-400">*</span>}
                  </label>
                  <textarea
                    value={sendHtmlContent}
                    onChange={(e) => setSendHtmlContent(e.target.value)}
                    placeholder="Enter HTML email content"
                    className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[300px] font-mono text-sm"
                  />
                </div>

                {/* Options */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptsMarketingOnly}
                      onChange={(e) => setAcceptsMarketingOnly(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-text-primary">
                      Only send to customers who accept marketing
                    </span>
                  </label>
                </div>

                {/* Send Button */}
                <div className="flex justify-end gap-4 pt-4 border-t border-border-default">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSendModal(false);
                      setSendResults(null);
                    }}
                    className="px-6 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmails}
                    disabled={sending || !selectedSmtpAccount || smtpAccounts.length === 0}
                    className="px-6 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Send Results */}
              {sendResults && (
                <div className="mt-6 p-4 bg-surface-elevated rounded-lg border border-border-default">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Send Results</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-surface-raised rounded-lg">
                      <p className="text-text-muted text-sm">Total</p>
                      <p className="text-2xl font-bold text-text-primary">{sendResults.total}</p>
                    </div>
                    <div className="p-4 bg-emerald-500/20 rounded-lg">
                      <p className="text-emerald-300 text-sm">Sent</p>
                      <p className="text-2xl font-bold text-emerald-400">{sendResults.sent}</p>
                    </div>
                    <div className="p-4 bg-red-500/20 rounded-lg">
                      <p className="text-red-300 text-sm">Failed</p>
                      <p className="text-2xl font-bold text-red-400">{sendResults.failed}</p>
                    </div>
                  </div>
                  {sendResults.errors && sendResults.errors.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-text-primary mb-2">Errors:</p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {sendResults.errors.map((error: any, idx: number) => (
                          <p key={idx} className="text-xs text-red-400">
                            {error.email}: {error.error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
