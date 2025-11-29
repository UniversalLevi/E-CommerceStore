'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import LoadingScreen from '@/components/LoadingScreen';
import Button from '@/components/Button';
import { notify } from '@/lib/toast';
import { CheckCircle, XCircle, Clock, Eye, MessageSquare, Mail } from 'lucide-react';

interface MentorshipApplication {
  _id: string;
  name: string;
  phone: string;
  email: string;
  incomeGoal?: string;
  businessStage?: string;
  whyMentorship: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function MentorshipApplicationsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<MentorshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedApplication, setSelectedApplication] = useState<MentorshipApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchApplications();
    }
  }, [isAuthenticated, user, statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/api/admin/mentorship/applications?status=${statusFilter}`
        : '/api/admin/mentorship/applications';
      const response = await api.get<{ success: boolean; applications: MentorshipApplication[] }>(url);
      if (response && response.success) {
        setApplications(response.applications || []);
      } else {
        setApplications([]);
        notify.error('Failed to load applications');
      }
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      setApplications([]);
      notify.error(error.response?.data?.error || error.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationNotes = async (id: string, notes?: string) => {
    try {
      setUpdating(true);
      await api.put(`/api/admin/mentorship/applications/${id}`, {
        adminNotes: notes || adminNotes,
      });
      notify.success('Notes updated successfully');
      fetchApplications();
      setSelectedApplication(null);
      setAdminNotes('');
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to update notes');
    } finally {
      setUpdating(false);
    }
  };

  const sendReply = async (id: string) => {
    if (!replyMessage.trim()) {
      notify.error('Please enter a reply message');
      return;
    }

    if (sendingReply) {
      return; // Prevent multiple sends
    }

    try {
      setSendingReply(true);
      const response = await api.post<{ success: boolean; message?: string }>(
        `/api/admin/mentorship/applications/${id}/reply`,
        {
          replyMessage: replyMessage.trim(),
        }
      );
      
      if (response && response.success) {
        notify.success('Reply sent successfully');
        setShowReplyModal(false);
        setReplyMessage('');
        setSelectedApplication(null);
        fetchApplications();
      } else {
        notify.error('Failed to send reply');
      }
    } catch (error: any) {
      notify.error(error.response?.data?.error || error.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          Pending
        </span>
      ),
      reviewed: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
          Reviewed
        </span>
      ),
      accepted: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
          Accepted
        </span>
      ),
      rejected: (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
          Rejected
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Mentorship Applications</h1>
          <p className="mt-2 text-text-secondary">Manage mentorship program applications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-raised border border-border-default rounded-lg p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-text-primary">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="">All Applications</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-surface-raised border border-border-default rounded-lg overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-text-secondary">No applications found</p>
          </div>
        ) : (
          <div className="divide-y divide-border-default">
            {applications.map((app) => (
              <div
                key={app._id}
                className="p-6 hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary">{app.name}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="space-y-1 text-sm text-text-secondary">
                      <p>
                        <span className="font-medium">Email:</span> {app.email}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span> {app.phone}
                      </p>
                      {app.incomeGoal && (
                        <p>
                          <span className="font-medium">Income Goal:</span> {app.incomeGoal}
                        </p>
                      )}
                      {app.businessStage && (
                        <p>
                          <span className="font-medium">Business Stage:</span> {app.businessStage}
                        </p>
                      )}
                      <p className="mt-2">
                        <span className="font-medium">Why Mentorship:</span>
                      </p>
                      <p className="text-text-primary bg-surface-elevated p-3 rounded-lg mt-1">
                        {app.whyMentorship}
                      </p>
                      {app.adminNotes && (
                        <div className="mt-2">
                          <p className="font-medium text-yellow-400">Admin Notes:</p>
                          <p className="text-text-primary bg-surface-elevated p-3 rounded-lg mt-1">
                            {app.adminNotes}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-text-muted mt-2">
                        Submitted: {new Date(app.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col gap-2">
                    <Button
                      onClick={() => {
                        setSelectedApplication(app);
                        setAdminNotes(app.adminNotes || '');
                      }}
                      variant="secondary"
                      iconLeft={<Eye className="h-4 w-4" />}
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApplication({ ...app }); // Set application for reply context
                        setShowReplyModal(true);
                        setReplyMessage('');
                      }}
                      variant="primary"
                      iconLeft={<Mail className="h-4 w-4" />}
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedApplication && !showReplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-border-default rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Application Details</h2>
                <button
                  onClick={() => {
                    setSelectedApplication(null);
                    setAdminNotes('');
                  }}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Name</label>
                  <p className="text-text-primary bg-surface-elevated p-3 rounded-lg">{selectedApplication.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Email</label>
                  <p className="text-text-primary bg-surface-elevated p-3 rounded-lg">{selectedApplication.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Phone</label>
                  <p className="text-text-primary bg-surface-elevated p-3 rounded-lg">{selectedApplication.phone}</p>
                </div>

                {selectedApplication.incomeGoal && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Income Goal</label>
                    <p className="text-text-primary bg-surface-elevated p-3 rounded-lg">
                      {selectedApplication.incomeGoal}
                    </p>
                  </div>
                )}

                {selectedApplication.businessStage && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Business Stage</label>
                    <p className="text-text-primary bg-surface-elevated p-3 rounded-lg">
                      {selectedApplication.businessStage}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Why Mentorship?</label>
                  <p className="text-text-primary bg-surface-elevated p-3 rounded-lg whitespace-pre-wrap">
                    {selectedApplication.whyMentorship}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Add admin notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => updateApplicationNotes(selectedApplication._id, adminNotes)}
                    variant="secondary"
                    loading={updating}
                    iconLeft={<MessageSquare className="h-4 w-4" />}
                  >
                    Save Notes
                  </Button>
                  <Button
                    onClick={() => {
                      setShowReplyModal(true);
                      setReplyMessage('');
                    }}
                    variant="primary"
                    iconLeft={<Mail className="h-4 w-4" />}
                  >
                    Send Reply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-border-default rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Send Reply</h2>
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyMessage('');
                  }}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    To: {selectedApplication.name} ({selectedApplication.email})
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Reply Message
                  </label>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Enter your reply message here..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowReplyModal(false);
                      setReplyMessage('');
                    }}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => sendReply(selectedApplication._id)}
                    variant="primary"
                    loading={sendingReply}
                    disabled={sendingReply}
                    iconLeft={<Mail className="h-4 w-4" />}
                  >
                    Send Reply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

