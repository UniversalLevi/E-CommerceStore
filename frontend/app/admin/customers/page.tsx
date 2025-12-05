'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import LoadingScreen from '@/components/LoadingScreen';
import {
  Mail,
  Phone,
  User,
  Store,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Send,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

interface Customer {
  _id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  acceptsMarketing: boolean;
  totalSpent: number;
  totalOrders: number;
  storeConnectionId: {
    _id: string;
    storeName: string;
    shopDomain: string;
    owner?: {
      _id: string;
      email?: string;
      mobile?: string;
      name?: string;
    };
  };
  createdAt: string;
}

interface StoreConnection {
  _id: string;
  storeName: string;
  shopDomain: string;
  owner: {
    _id: string;
    email?: string;
    mobile?: string;
    name?: string;
  };
}

export default function AdminCustomersPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stores, setStores] = useState<StoreConnection[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [acceptsMarketingFilter, setAcceptsMarketingFilter] = useState<boolean | null>(null);
  const [showStoreSelector, setShowStoreSelector] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

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
    } else if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchStores();
      fetchSmtpAccounts();
      fetchTemplates();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchCustomers();
    }
  }, [isAuthenticated, user, pagination.page, selectedStores, searchQuery, acceptsMarketingFilter]);

  const fetchStores = async () => {
    try {
      const response = await api.get<{ success: boolean; data: StoreConnection[] }>('/api/stores');
      setStores(response.data);
    } catch (error: any) {
      console.error('Failed to fetch stores:', error);
      notify.error('Failed to load stores');
    }
  };

  const fetchSmtpAccounts = async () => {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>('/api/admin/email-sender/smtp-accounts');
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
      const response = await api.get<{ success: boolean; data: any[] }>('/api/admin/email-sender/templates');
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

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.adminGetCustomers({
        storeIds: selectedStores.length > 0 ? selectedStores : undefined,
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        acceptsMarketing:
          acceptsMarketingFilter !== null ? acceptsMarketingFilter : undefined,
      });

      setCustomers(response.data.customers);
      setPagination(response.data.pagination);
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
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
      }>('/api/admin/email-sender/send-to-customers', {
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
    setPagination({ ...pagination, page: 1 });
  };

  const selectAllStores = () => {
    setSelectedStores(stores.map((s) => s._id));
    setPagination({ ...pagination, page: 1 });
  };

  const deselectAllStores = () => {
    setSelectedStores([]);
    setPagination({ ...pagination, page: 1 });
  };

  const handleExport = () => {
    // Create CSV content
    const headers = [
      'Store Name',
      'Owner Email',
      'Customer Email',
      'Phone',
      'Name',
      'Accepts Marketing',
      'Total Spent',
      'Total Orders',
      'Created At',
    ];

    const rows = customers.map((customer) => [
      customer.storeConnectionId?.storeName || '',
      customer.storeConnectionId?.owner?.email || '',
      customer.email || '',
      customer.phone || '',
      customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      customer.acceptsMarketing ? 'Yes' : 'No',
      customer.totalSpent.toString(),
      customer.totalOrders.toString(),
      new Date(customer.createdAt).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    notify.success('Customers exported successfully');
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  const customersWithEmail = customers.filter((c) => c.email).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              All Customers
            </span>
          </h1>
          <p className="mt-2 text-text-secondary">
            View and manage customers from all stores
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (selectedStores.length === 0) {
                notify.error('Please select at least one store first');
                return;
              }
              setShowSendModal(true);
            }}
            className="px-6 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg hover:from-violet-600 hover:to-fuchsia-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Send className="w-4 h-4" />
            Send Email
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
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
                <h2 className="text-lg font-semibold text-text-primary">Filter by Store</h2>
                <p className="text-sm text-text-secondary">
                  {selectedStores.length === 0
                    ? 'All stores (no filter)'
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
                  Clear All
                </button>
              </div>

              {/* Store List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
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
                          <p className="text-xs text-text-muted ml-7 mt-1">
                            Owner: {store.owner?.email || store.owner?.mobile || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface-raised border border-border-default rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <Search className="w-4 h-4 inline mr-2" />
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              placeholder="Search by email, phone, or name"
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Marketing Filter */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <Filter className="w-4 h-4 inline mr-2" />
              Marketing Preference
            </label>
            <select
              value={acceptsMarketingFilter === null ? 'all' : acceptsMarketingFilter ? 'yes' : 'no'}
              onChange={(e) => {
                const value = e.target.value;
                setAcceptsMarketingFilter(
                  value === 'all' ? null : value === 'yes'
                );
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Customers</option>
              <option value="yes">Accepts Marketing</option>
              <option value="no">Doesn't Accept Marketing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Marketing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Orders
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {customers.map((customer) => (
                <tr key={customer._id} className="hover:bg-surface-elevated">
                  <td className="px-6 py-4 text-sm text-text-primary">
                    {customer.storeConnectionId?.storeName || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {customer.storeConnectionId?.owner?.email || 
                     customer.storeConnectionId?.owner?.mobile || 
                     '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-primary">
                    {customer.email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-text-muted" />
                        {customer.email}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-primary">
                    {customer.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-text-muted" />
                        {customer.phone}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-primary">
                    {customer.fullName || 
                     (customer.firstName && customer.lastName
                       ? `${customer.firstName} ${customer.lastName}`
                       : customer.firstName || customer.lastName || '-')}
                  </td>
                  <td className="px-6 py-4">
                    {customer.acceptsMarketing ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                        <CheckCircle className="w-3 h-3" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                        <XCircle className="w-3 h-3" />
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-primary">
                    ₹{customer.totalSpent.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-primary">
                    {customer.totalOrders}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center p-6 border-t border-border-default">
            <p className="text-text-secondary text-sm">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} customers
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.pages}
                className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {customers.length === 0 && !loading && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">No customers found</p>
          </div>
        )}
      </div>

      {/* Send Email Modal */}
      {showSendModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSendModal(false);
              setSendResults(null);
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
                  <p className="text-xs text-text-muted mt-2">
                    Approximately {customersWithEmail} customers with email addresses
                  </p>
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
