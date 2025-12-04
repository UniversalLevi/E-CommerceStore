'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import LoadingScreen from '@/components/LoadingScreen';
import {
  Mail,
  Settings,
  FileText,
  Send,
  History,
  Plus,
  Edit,
  Trash2,
  TestTube,
  Upload,
  X,
  Check,
  AlertCircle,
  Copy,
  Download,
} from 'lucide-react';

interface SmtpAccount {
  _id: string;
  name: string;
  smtpServer: string;
  smtpPort: number;
  useTls: boolean;
  email: string;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
}

interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  htmlContent: string;
  plainTextContent?: string;
  isDefault: boolean;
  createdAt: string;
}

interface EmailLog {
  _id: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
  smtpAccountId: {
    name: string;
    email: string;
  };
  templateId?: {
    name: string;
  };
}

type Tab = 'smtp' | 'templates' | 'send' | 'logs';

export default function EmailSenderPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('send');
  const [loading, setLoading] = useState(true);

  // SMTP Accounts
  const [smtpAccounts, setSmtpAccounts] = useState<SmtpAccount[]>([]);
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [editingSmtp, setEditingSmtp] = useState<SmtpAccount | null>(null);
  const [smtpForm, setSmtpForm] = useState({
    name: '',
    smtpServer: '',
    smtpPort: '587',
    useTls: true,
    email: '',
    password: '',
    isDefault: false,
    active: true,
  });

  // Email Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    plainTextContent: '',
    isDefault: false,
  });

  // Send Emails
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [selectedSmtpAccount, setSelectedSmtpAccount] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [sendSubject, setSendSubject] = useState('');
  const [sendHtmlContent, setSendHtmlContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<any>(null);

  // Email Logs
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logsPagination, setLogsPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [logsFilter, setLogsFilter] = useState({
    status: '',
    recipient: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchAllData();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchEmailLogs();
    }
  }, [activeTab, logsPagination.page, logsFilter]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchSmtpAccounts(), fetchTemplates()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSmtpAccounts = async () => {
    const response = await api.getSmtpAccounts();
    setSmtpAccounts(response.data);
    if (response.data.length > 0 && !selectedSmtpAccount) {
      const defaultAccount = response.data.find((a: SmtpAccount) => a.isDefault) || response.data[0];
      setSelectedSmtpAccount(defaultAccount._id);
    }
  };

  const fetchTemplates = async () => {
    const response = await api.getEmailTemplates();
    setTemplates(response.data);
    if (response.data.length > 0 && !selectedTemplate) {
      const defaultTemplate = response.data.find((t: EmailTemplate) => t.isDefault) || response.data[0];
      setSelectedTemplate(defaultTemplate._id);
      setSendSubject(defaultTemplate.subject);
      setSendHtmlContent(defaultTemplate.htmlContent);
    }
  };

  const fetchEmailLogs = async () => {
    const response = await api.getEmailLogs({
      page: logsPagination.page,
      limit: logsPagination.limit,
      status: logsFilter.status || undefined,
      recipient: logsFilter.recipient || undefined,
    });
    setLogs(response.data.logs);
    setLogsPagination(response.data.pagination);
  };

  const handleSmtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSmtp) {
        await api.updateSmtpAccount(editingSmtp._id, smtpForm);
        notify.success('SMTP account updated successfully');
      } else {
        await api.createSmtpAccount(smtpForm);
        notify.success('SMTP account created successfully');
      }
      setShowSmtpModal(false);
      setEditingSmtp(null);
      setSmtpForm({
        name: '',
        smtpServer: '',
        smtpPort: '587',
        useTls: true,
        email: '',
        password: '',
        isDefault: false,
        active: true,
      });
      fetchSmtpAccounts();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to save SMTP account');
    }
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await api.updateEmailTemplate(editingTemplate._id, templateForm);
        notify.success('Email template updated successfully');
      } else {
        await api.createEmailTemplate(templateForm);
        notify.success('Email template created successfully');
      }
      setShowTemplateModal(false);
      setEditingTemplate(null);
      setTemplateForm({
        name: '',
        subject: '',
        htmlContent: '',
        plainTextContent: '',
        isDefault: false,
      });
      fetchTemplates();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to save email template');
    }
  };

  const handleDeleteSmtp = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SMTP account?')) return;
    try {
      await api.deleteSmtpAccount(id);
      notify.success('SMTP account deleted successfully');
      fetchSmtpAccounts();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to delete SMTP account');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.deleteEmailTemplate(id);
      notify.success('Email template deleted successfully');
      fetchTemplates();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to delete template');
    }
  };

  const handleTestSmtp = async (id: string) => {
    try {
      await api.testSmtpAccount(id);
      notify.success('SMTP connection test successful');
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'SMTP connection test failed');
    }
  };

  const handleAddRecipient = () => {
    const emails = recipientInput
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter((e) => e && e.includes('@'));
    setRecipients([...recipients, ...emails]);
    setRecipientInput('');
  };

  const handleRemoveRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const emails = text
        .split(/[,\n]/)
        .map((e) => e.trim())
        .filter((e) => e && e.includes('@'));
      setRecipients([...recipients, ...emails]);
    };
    reader.readAsText(file);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t._id === templateId);
    if (template) {
      setSendSubject(template.subject);
      setSendHtmlContent(template.htmlContent);
    }
  };

  const handleSendEmails = async () => {
    if (recipients.length === 0) {
      notify.error('Please add at least one recipient');
      return;
    }

    if (!sendSubject && !selectedTemplate) {
      notify.error('Please provide a subject or select a template');
      return;
    }

    if (!sendHtmlContent && !selectedTemplate) {
      notify.error('Please provide HTML content or select a template');
      return;
    }

    try {
      setSending(true);
      const response = await api.sendBulkEmails({
        recipients,
        subject: sendSubject || undefined,
        htmlContent: sendHtmlContent || undefined,
        smtpAccountId: selectedSmtpAccount || undefined,
        templateId: selectedTemplate || undefined,
      });

      setSendResults(response.data);
      notify.success(`Sent ${response.data.sent} emails successfully`);

      if (response.data.failed > 0) {
        notify.warning(`${response.data.failed} emails failed to send`);
      }

      // Clear form
      setRecipients([]);
      setSendSubject('');
      setSendHtmlContent('');
      setSelectedTemplate('');

      // Refresh logs
      if (activeTab === 'logs') {
        fetchEmailLogs();
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            Email Sender
          </span>
        </h1>
        <p className="mt-2 text-text-secondary">Send bulk emails to multiple recipients</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-default">
        {[
          { id: 'send', label: 'Send Emails', icon: Send },
          { id: 'smtp', label: 'SMTP Accounts', icon: Settings },
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'logs', label: 'Email Logs', icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Send Emails Tab */}
      {activeTab === 'send' && (
        <div className="space-y-6">
          {/* SMTP Account Selection */}
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              SMTP Account
            </label>
            <select
              value={selectedSmtpAccount}
              onChange={(e) => setSelectedSmtpAccount(e.target.value)}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Use Default Account</option>
              {smtpAccounts
                .filter((a) => a.active)
                .map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.name} ({account.email}) {account.isDefault && '(Default)'}
                  </option>
                ))}
            </select>
          </div>

          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="bg-surface-raised border border-border-default rounded-xl p-6">
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

          {/* Recipients */}
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-text-primary">
                Recipients ({recipients.length})
              </label>
              <div className="flex gap-2">
                <label className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary cursor-pointer hover:bg-surface-hover transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload File
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <textarea
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder="Enter email addresses (one per line or comma-separated)"
                className="flex-1 px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleAddRecipient();
                  }
                }}
              />
              <button
                onClick={handleAddRecipient}
                className="px-6 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
              >
                Add
              </button>
            </div>

            {recipients.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {recipients.map((email, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-surface-elevated rounded-lg"
                  >
                    <span className="text-text-primary text-sm">{email}</span>
                    <button
                      onClick={() => handleRemoveRecipient(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Subject
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
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              HTML Content
            </label>
            <textarea
              value={sendHtmlContent}
              onChange={(e) => setSendHtmlContent(e.target.value)}
              placeholder="Enter HTML email content"
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[300px] font-mono text-sm"
            />
          </div>

          {/* Send Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSendEmails}
              disabled={sending || recipients.length === 0}
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg hover:from-violet-600 hover:to-fuchsia-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send to {recipients.length} Recipient{recipients.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>

          {/* Send Results */}
          {sendResults && (
            <div className="bg-surface-raised border border-border-default rounded-xl p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Send Results</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-surface-elevated rounded-lg">
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

              {sendResults.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-text-primary font-medium mb-2">Errors:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {sendResults.errors.map((error: any, index: number) => (
                      <div key={index} className="text-sm text-red-400">
                        {error.email}: {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SMTP Accounts Tab */}
      {activeTab === 'smtp' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingSmtp(null);
                setSmtpForm({
                  name: '',
                  smtpServer: '',
                  smtpPort: '587',
                  useTls: true,
                  email: '',
                  password: '',
                  isDefault: false,
                  active: true,
                });
                setShowSmtpModal(true);
              }}
              className="px-6 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add SMTP Account
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {smtpAccounts.map((account) => (
              <div
                key={account._id}
                className="bg-surface-raised border border-border-default rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{account.name}</h3>
                    <p className="text-sm text-text-muted">{account.email}</p>
                  </div>
                  <div className="flex gap-2">
                    {account.isDefault && (
                      <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded text-xs">
                        Default
                      </span>
                    )}
                    {account.active ? (
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-text-secondary mb-4">
                  <p>
                    <strong>Server:</strong> {account.smtpServer}:{account.smtpPort}
                  </p>
                  <p>
                    <strong>TLS:</strong> {account.useTls ? 'Yes' : 'No'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestSmtp(account._id)}
                    className="flex-1 px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-2"
                  >
                    <TestTube className="w-4 h-4" />
                    Test
                  </button>
                  <button
                    onClick={() => {
                      setEditingSmtp(account);
                      setSmtpForm({
                        name: account.name,
                        smtpServer: account.smtpServer,
                        smtpPort: account.smtpPort.toString(),
                        useTls: account.useTls,
                        email: account.email,
                        password: '', // Don't show password
                        isDefault: account.isDefault,
                        active: account.active,
                      });
                      setShowSmtpModal(true);
                    }}
                    className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSmtp(account._id)}
                    className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {smtpAccounts.length === 0 && (
            <div className="text-center py-12 bg-surface-raised border border-border-default rounded-xl">
              <Mail className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No SMTP accounts configured</p>
            </div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingTemplate(null);
                setTemplateForm({
                  name: '',
                  subject: '',
                  htmlContent: '',
                  plainTextContent: '',
                  isDefault: false,
                });
                setShowTemplateModal(true);
              }}
              className="px-6 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div
                key={template._id}
                className="bg-surface-raised border border-border-default rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{template.name}</h3>
                    <p className="text-sm text-text-muted">{template.subject}</p>
                  </div>
                  {template.isDefault && (
                    <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded text-xs">
                      Default
                    </span>
                  )}
                </div>

                <div
                  className="text-sm text-text-secondary mb-4 line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: template.htmlContent.substring(0, 200) }}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingTemplate(template);
                      setTemplateForm({
                        name: template.name,
                        subject: template.subject,
                        htmlContent: template.htmlContent,
                        plainTextContent: template.plainTextContent || '',
                        isDefault: template.isDefault,
                      });
                      setShowTemplateModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template._id)}
                    className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12 bg-surface-raised border border-border-default rounded-xl">
              <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No email templates created</p>
            </div>
          )}
        </div>
      )}

      {/* Email Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-surface-raised border border-border-default rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Status</label>
                <select
                  value={logsFilter.status}
                  onChange={(e) => {
                    setLogsFilter({ ...logsFilter, status: e.target.value });
                    setLogsPagination({ ...logsPagination, page: 1 });
                  }}
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Recipient
                </label>
                <input
                  type="text"
                  value={logsFilter.recipient}
                  onChange={(e) => {
                    setLogsFilter({ ...logsFilter, recipient: e.target.value });
                    setLogsPagination({ ...logsPagination, page: 1 });
                  }}
                  placeholder="Search by email"
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      SMTP Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Template
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Sent At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-surface-elevated">
                      <td className="px-6 py-4 text-sm text-text-primary">{log.recipient}</td>
                      <td className="px-6 py-4 text-sm text-text-primary">{log.subject}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            log.status === 'sent'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : log.status === 'failed'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {log.smtpAccountId?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {log.templateId?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {log.sentAt
                          ? new Date(log.sentAt).toLocaleString()
                          : new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logsPagination.pages > 1 && (
              <div className="flex justify-between items-center p-6 border-t border-border-default">
                <p className="text-text-secondary text-sm">
                  Showing {(logsPagination.page - 1) * logsPagination.limit + 1} to{' '}
                  {Math.min(logsPagination.page * logsPagination.limit, logsPagination.total)} of{' '}
                  {logsPagination.total} logs
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setLogsPagination({ ...logsPagination, page: logsPagination.page - 1 })
                    }
                    disabled={logsPagination.page === 1}
                    className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setLogsPagination({ ...logsPagination, page: logsPagination.page + 1 })
                    }
                    disabled={logsPagination.page >= logsPagination.pages}
                    className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMTP Account Modal */}
      {showSmtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-border-default rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text-primary">
                  {editingSmtp ? 'Edit SMTP Account' : 'Add SMTP Account'}
                </h2>
                <button
                  onClick={() => setShowSmtpModal(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSmtpSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Name</label>
                  <input
                    type="text"
                    value={smtpForm.name}
                    onChange={(e) => setSmtpForm({ ...smtpForm, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      SMTP Server
                    </label>
                    <input
                      type="text"
                      value={smtpForm.smtpServer}
                      onChange={(e) => setSmtpForm({ ...smtpForm, smtpServer: e.target.value })}
                      required
                      placeholder="smtp.gmail.com"
                      className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Port</label>
                    <input
                      type="number"
                      value={smtpForm.smtpPort}
                      onChange={(e) => setSmtpForm({ ...smtpForm, smtpPort: e.target.value })}
                      required
                      min="1"
                      max="65535"
                      className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Email</label>
                  <input
                    type="email"
                    value={smtpForm.email}
                    onChange={(e) => setSmtpForm({ ...smtpForm, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Password / App Password
                  </label>
                  <input
                    type="password"
                    value={smtpForm.password}
                    onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                    required={!editingSmtp}
                    placeholder={editingSmtp ? 'Leave blank to keep current password' : ''}
                    className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smtpForm.useTls}
                      onChange={(e) => setSmtpForm({ ...smtpForm, useTls: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-text-primary">Use TLS</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smtpForm.isDefault}
                      onChange={(e) => setSmtpForm({ ...smtpForm, isDefault: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-text-primary">Set as Default</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smtpForm.active}
                      onChange={(e) => setSmtpForm({ ...smtpForm, active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-text-primary">Active</span>
                  </label>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSmtpModal(false)}
                    className="px-6 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
                  >
                    {editingSmtp ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-border-default rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text-primary">
                  {editingTemplate ? 'Edit Email Template' : 'Add Email Template'}
                </h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleTemplateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Subject</label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    HTML Content
                  </label>
                  <textarea
                    value={templateForm.htmlContent}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, htmlContent: e.target.value })
                    }
                    required
                    rows={15}
                    className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Plain Text Content (Optional)
                  </label>
                  <textarea
                    value={templateForm.plainTextContent}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, plainTextContent: e.target.value })
                    }
                    rows={5}
                    className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateForm.isDefault}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, isDefault: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-text-primary">Set as Default Template</span>
                  </label>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(false)}
                    className="px-6 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
                  >
                    {editingTemplate ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

