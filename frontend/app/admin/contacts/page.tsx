'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';

interface Contact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'replied' | 'resolved' | 'archived';
  adminReply?: string;
  repliedBy?: {
    _id: string;
    email: string;
  };
  repliedAt?: string;
  userId?: {
    _id: string;
    email: string;
  };
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminContactsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchContacts = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'admin') return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await api.get<{
        success: boolean;
        data: { contacts: Contact[]; pagination: Pagination };
      }>(`/api/admin/contacts?${params.toString()}`);

      setContacts(response.data.contacts);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      setError(error.response?.data?.message || 'Failed to load contacts');
      notify.error(error.response?.data?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, currentPage, search, statusFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleReply = async () => {
    if (!selectedContact || !replyText.trim()) {
      notify.error('Please enter a reply message');
      return;
    }

    try {
      setReplying(true);
      await api.post(`/api/admin/contacts/${selectedContact._id}/reply`, {
        reply: replyText.trim(),
      });

      notify.success('Reply sent successfully');
      setSelectedContact(null);
      setReplyText('');
      fetchContacts();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (contactId: string, newStatus: string) => {
    try {
      await api.put(`/api/admin/contacts/${contactId}/status`, {
        status: newStatus,
      });

      notify.success('Status updated successfully');
      fetchContacts();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (contactId: string, contactEmail: string) => {
    if (!confirm(`Are you sure you want to delete the contact from "${contactEmail}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/api/admin/contacts/${contactId}`);
      notify.success('Contact deleted successfully');
      fetchContacts();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to delete contact');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-accent-500/20 text-accent-400 border border-accent-500/50',
      replied: 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/50',
      resolved: 'bg-primary-500/20 text-primary-500 border border-primary-500/50',
      archived: 'bg-text-muted/20 text-text-muted border border-border-default',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-text-primary">Contact Submissions</h1>
            <p className="mt-2 text-text-secondary">Manage and reply to contact form submissions</p>
          </div>

          {/* Filters */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name, email, subject..."
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="replied">Replied</option>
                  <option value="resolved">Resolved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchInput('');
                    setStatusFilter('all');
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 bg-surface-elevated hover:bg-surface-hover text-text-primary rounded-lg font-medium transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Contacts Table */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-default">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface-raised divide-y divide-border-default">
                  {contacts.map((contact) => (
                    <tr key={contact._id} className="hover:bg-surface-hover">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-text-primary">{contact.name}</div>
                          <div className="text-sm text-text-muted">{contact.email}</div>
                          {contact.userId && (
                            <div className="text-xs text-text-muted mt-1">
                              User: {contact.userId.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-text-primary">{contact.subject}</div>
                        <div className="text-xs text-text-muted mt-1 line-clamp-1">
                          {contact.message.substring(0, 60)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(contact.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setSelectedContact(contact)}
                          className={`${contact.status === 'resolved' ? 'text-text-muted cursor-not-allowed' : 'text-primary-500 hover:text-primary-400'}`}
                          disabled={contact.status === 'resolved'}
                          title={contact.status === 'resolved' ? 'Cannot edit resolved contacts' : 'View/Reply'}
                        >
                          View{contact.status === 'resolved' ? '' : '/Reply'}
                        </button>
                        <select
                          value={contact.status}
                          onChange={(e) => handleStatusChange(contact._id, e.target.value)}
                          disabled={contact.status === 'resolved'}
                          className={`text-sm bg-surface-elevated border border-border-default text-text-primary rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 ${contact.status === 'resolved' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={contact.status === 'resolved' ? 'Cannot change status of resolved contacts' : 'Change status'}
                        >
                          <option value="pending">Pending</option>
                          <option value="replied">Replied</option>
                          <option value="resolved">Resolved</option>
                          <option value="archived">Archived</option>
                        </select>
                        <button
                          onClick={() => handleDelete(contact._id, contact.email)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="bg-surface-elevated px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} contacts
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-surface-raised border border-border-default text-text-primary rounded-lg text-sm font-medium hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 bg-surface-raised border border-border-default text-text-primary rounded-lg text-sm font-medium hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-text-primary">Contact Details</h3>
                <button
                  onClick={() => {
                    setSelectedContact(null);
                    setReplyText('');
                  }}
                  className="text-text-muted hover:text-text-primary text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">From</label>
                  <p className="text-text-primary">{selectedContact.name} ({selectedContact.email})</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Subject</label>
                  <p className="text-text-primary">{selectedContact.subject}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Message</label>
                  <div className="bg-surface-hover border border-border-default rounded-lg p-4">
                    <p className="text-text-secondary whitespace-pre-wrap">{selectedContact.message}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Date</label>
                  <p className="text-text-muted text-sm">
                    {new Date(selectedContact.createdAt).toLocaleString()}
                  </p>
                </div>

                {selectedContact.adminReply && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Previous Reply
                    </label>
                    <div className="bg-surface-hover border border-border-default rounded-lg p-4">
                      <p className="text-text-secondary whitespace-pre-wrap">{selectedContact.adminReply}</p>
                      {selectedContact.repliedBy && (
                        <p className="text-xs text-text-muted mt-2">
                          Replied by {selectedContact.repliedBy.email} on{' '}
                          {selectedContact.repliedAt
                            ? new Date(selectedContact.repliedAt).toLocaleString()
                            : 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Reply Message
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={6}
                  disabled={selectedContact.status === 'resolved'}
                  className={`w-full px-4 py-2 bg-surface-elevated border border-border-default text-text-primary placeholder:text-text-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${selectedContact.status === 'resolved' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder={selectedContact.status === 'resolved' ? 'Cannot reply to resolved contacts' : 'Type your reply here...'}
                />
                {selectedContact.status === 'resolved' && (
                  <p className="text-xs text-text-muted mt-2">
                    This contact has been resolved and cannot be edited or replied to.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || replying || selectedContact.status === 'resolved'}
                  className="flex-1 bg-primary-500 hover:bg-primary-400 text-black py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {replying ? 'Sending...' : 'Send Reply'}
                </button>
                <button
                  onClick={() => {
                    setSelectedContact(null);
                    setReplyText('');
                  }}
                  className="px-6 py-3 bg-surface-elevated hover:bg-surface-hover text-text-primary rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

