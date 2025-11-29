'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import LoadingScreen from '@/components/LoadingScreen';
import Button from '@/components/Button';
import { notify } from '@/lib/toast';
import { Send, Users, X, Eye, Clock, CheckCircle } from 'lucide-react';

interface User {
  _id: string;
  email?: string;
  mobile?: string;
  role: string;
}

export default function AdminSendNotificationPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [notificationDetails, setNotificationDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchUsers();
      fetchNotificationHistory();
    }
  }, [isAuthenticated, user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get<{
        success: boolean;
        data: { users: User[] };
      }>('/api/admin/users?limit=1000');

      setUsers(response.data.users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      notify.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAll = () => {
    const filtered = filteredUsers.map((u) => u._id);
    setSelectedUserIds(filtered);
  };

  const deselectAll = () => {
    setSelectedUserIds([]);
  };

  const fetchNotificationHistory = async () => {
    try {
      setLoadingHistory(true);
      // Fetch recent admin_sent notifications
      const response = await api.get<{
        success: boolean;
        data: any[];
      }>('/api/admin/notifications/history?limit=20');

      if (response.success) {
        setNotificationHistory(response.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching notification history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchNotificationDetails = async (notification: any) => {
    try {
      setLoadingDetails(true);
      setSelectedNotification(notification);
      const response = await api.get<{
        success: boolean;
        data: any[];
      }>(`/api/admin/notifications/details?title=${encodeURIComponent(notification.title)}&message=${encodeURIComponent(notification.message)}&date=${new Date(notification.createdAt).toDateString()}`);

      if (response.success) {
        setNotificationDetails(response.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching notification details:', error);
      notify.error('Failed to load notification details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSend = async () => {
    if (selectedUserIds.length === 0) {
      notify.error('Please select at least one user');
      return;
    }

    if (!title.trim() || !message.trim()) {
      notify.error('Title and message are required');
      return;
    }

    try {
      setSending(true);
      await api.post('/api/admin/notifications/send', {
        userIds: selectedUserIds,
        title: title.trim(),
        message: message.trim(),
        type: 'admin_sent',
      });

      notify.success(`Notification sent to ${selectedUserIds.length} user(s)`);
      setTitle('');
      setMessage('');
      setSelectedUserIds([]);
      fetchNotificationHistory(); // Refresh history
    } catch (error: any) {
      notify.error(error.response?.data?.error || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  const filteredUsers = users.filter((u) => {
    const search = searchTerm.toLowerCase();
    const email = u.email?.toLowerCase() || '';
    const mobile = u.mobile?.toLowerCase() || '';
    return email.includes(search) || mobile.includes(search);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Send Notification</h1>
        <p className="text-text-secondary mt-1">Send notifications to one or more users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Form */}
        <div className="bg-surface-raised border border-border-default rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Notification Details</h2>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="Notification title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="Notification message"
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSend}
              loading={sending}
              disabled={selectedUserIds.length === 0}
              variant="primary"
              iconLeft={<Send className="h-4 w-4" />}
              className="w-full"
            >
              Send to {selectedUserIds.length} User{selectedUserIds.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>

        {/* User Selection */}
        <div className="bg-surface-raised border border-border-default rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-text-primary">Select Users</h2>
            <div className="flex items-center gap-2">
              <Button onClick={selectAll} variant="ghost" size="sm">
                Select All
              </Button>
              <Button onClick={deselectAll} variant="ghost" size="sm">
                Clear
              </Button>
            </div>
          </div>

          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-surface-elevated border border-border-default rounded-lg text-text-primary focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="Search by email or mobile..."
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredUsers.length === 0 ? (
              <p className="text-text-secondary text-center py-8">No users found</p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user._id}
                  onClick={() => toggleUserSelection(user._id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedUserIds.includes(user._id)
                      ? 'bg-yellow-500/20 border-yellow-500/50'
                      : 'bg-surface-elevated border-border-default hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">
                        {user.email || user.mobile || 'No contact info'}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {user.email && user.mobile ? `${user.mobile} • ` : ''}
                        {user.role}
                      </p>
                    </div>
                    {selectedUserIds.includes(user._id) && (
                      <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                        <X className="h-3 w-3 text-black" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Notification History */}
      <div className="bg-surface-raised border border-border-default rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Notifications Sent</h2>
        {loadingHistory ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="mt-2 text-text-secondary">Loading history...</p>
          </div>
        ) : notificationHistory.length === 0 ? (
          <p className="text-text-secondary text-center py-8">No notification history found</p>
        ) : (
          <div className="space-y-3">
            {notificationHistory.map((notif: any) => (
              <div
                key={notif._id}
                className="p-4 bg-surface-elevated border border-border-default rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary mb-1">{notif.title}</h3>
                    <p className="text-sm text-text-secondary mb-2">{notif.message}</p>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span>Sent to {notif.recipientCount || 1} user(s)</span>
                      <span>{new Date(notif.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => fetchNotificationDetails(notif)}
                    variant="ghost"
                    size="sm"
                    iconLeft={<Eye className="h-4 w-4" />}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Details Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised border border-border-default rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Notification Details</h2>
                <button
                  onClick={() => {
                    setSelectedNotification(null);
                    setNotificationDetails([]);
                  }}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ×
                </button>
              </div>

              <div className="mb-6 space-y-2">
                <h3 className="text-lg font-semibold text-text-primary">{selectedNotification.title}</h3>
                <p className="text-text-secondary">{selectedNotification.message}</p>
                <div className="flex items-center gap-4 text-sm text-text-muted">
                  <span>Sent: {new Date(selectedNotification.createdAt).toLocaleString()}</span>
                  <span>Recipients: {selectedNotification.recipientCount || notificationDetails.length}</span>
                </div>
              </div>

              {loadingDetails ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                  <p className="mt-2 text-text-secondary">Loading details...</p>
                </div>
              ) : notificationDetails.length === 0 ? (
                <p className="text-text-secondary text-center py-8">No details found</p>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-semibold text-text-primary">Recipients:</h4>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {notificationDetails.map((detail: any) => (
                      <div
                        key={detail._id}
                        className="p-3 bg-surface-elevated border border-border-default rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-text-primary">
                              {detail.userEmail || detail.userMobile || 'Unknown user'}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-text-muted mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(detail.createdAt).toLocaleString()}
                              </span>
                              {detail.read && (
                                <span className="flex items-center gap-1 text-green-400">
                                  <CheckCircle className="h-3 w-3" />
                                  Read {detail.readAt ? new Date(detail.readAt).toLocaleString() : ''}
                                </span>
                              )}
                              {!detail.read && (
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                                  Unread
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

