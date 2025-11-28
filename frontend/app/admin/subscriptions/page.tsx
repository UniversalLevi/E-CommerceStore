'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import LoadingScreen from '@/components/LoadingScreen';
import ConfirmModal from '@/components/ConfirmModal';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface Subscription {
  id: string;
  userId: string;
  userEmail: string;
  planCode: string;
  planName: string;
  status: string;
  startDate: string;
  endDate?: string | null;
  renewalDate?: string;
  amountPaid: number;
  source: string;
  adminNote?: string;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  history: Array<{
    action: string;
    timestamp: string;
    adminId?: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  email: string;
  plan: string | null;
  planExpiresAt: string | null;
  isLifetime: boolean;
}

export default function AdminSubscriptionsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal states
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  // Form states
  const [grantForm, setGrantForm] = useState({
    planCode: 'starter_30',
    daysValid: '',
    endDate: '',
    adminNote: '',
  });
  const [revokeForm, setRevokeForm] = useState({ reason: '' });
  const [updateForm, setUpdateForm] = useState({
    planCode: '',
    extendDays: '',
    adminNote: '',
  });
  const [noteForm, setNoteForm] = useState({ note: '' });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const searchUser = async () => {
    if (!searchQuery.trim()) {
      notify.error('Please enter an email or user ID');
      return;
    }

    try {
      setSearching(true);
      // Try to find user by email or ID
      const response = await api.get<{
        success: boolean;
        data: { users: User[]; pagination: any };
      }>(`/api/admin/users?search=${encodeURIComponent(searchQuery)}&limit=1`);

      if (response.data.users && response.data.users.length > 0) {
        const foundUser = response.data.users[0];
        setSearchedUser(foundUser);
        await fetchUserSubscription(foundUser._id);
        await fetchSubscriptionHistory(foundUser._id);
      } else {
        notify.error('User not found');
        setSearchedUser(null);
        setSubscription(null);
        setSubscriptionHistory([]);
      }
    } catch (error: any) {
      console.error('Error searching user:', error);
      notify.error(error.response?.data?.message || 'Failed to search user');
    } finally {
      setSearching(false);
    }
  };

  const fetchUserSubscription = async (userId: string) => {
    try {
      setLoading(true);
      // Get active or manually_granted subscription
      const response = await api.get<{
        success: boolean;
        data: { subscriptions: Subscription[] };
      }>(`/api/admin/subscriptions?userId=${userId}&status=active`);

      console.log('Subscription API response:', response.data);

      if (response.data && response.data.subscriptions && response.data.subscriptions.length > 0) {
        const activeSub = response.data.subscriptions.find(
          (sub) => sub.status === 'active' || sub.status === 'manually_granted'
        ) || response.data.subscriptions[0];
        console.log('Setting subscription:', activeSub);
        setSubscription(activeSub);
      } else {
        // Try without status filter to get any subscription
        const allResponse = await api.get<{
          success: boolean;
          data: { subscriptions: Subscription[] };
        }>(`/api/admin/subscriptions?userId=${userId}`);
        
        if (allResponse.data && allResponse.data.subscriptions && allResponse.data.subscriptions.length > 0) {
          const activeSub = allResponse.data.subscriptions.find(
            (sub) => sub.status === 'active' || sub.status === 'manually_granted'
          );
          if (activeSub) {
            console.log('Setting subscription from all:', activeSub);
            setSubscription(activeSub);
          } else {
            console.log('No active subscription found');
            setSubscription(null);
          }
        } else {
          console.log('No subscriptions found');
          setSubscription(null);
        }
      }
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionHistory = async (userId: string) => {
    try {
      setLoadingHistory(true);
      const response = await api.get<{
        success: boolean;
        data: { subscriptions: Subscription[] };
      }>(`/api/admin/subscriptions/user/${userId}/history`);

      setSubscriptionHistory(response.data.subscriptions || []);
    } catch (error: any) {
      console.error('Error fetching subscription history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGrant = async () => {
    if (!searchedUser) return;

    try {
      const payload: any = {
        userId: searchedUser._id,
        planCode: grantForm.planCode,
      };

      if (grantForm.daysValid) {
        payload.daysValid = parseInt(grantForm.daysValid);
      } else if (grantForm.endDate) {
        payload.endDate = grantForm.endDate;
      }

      if (grantForm.adminNote) {
        payload.adminNote = grantForm.adminNote;
      }

      await api.post('/api/admin/subscriptions/grant', payload);
      notify.success('Subscription granted successfully');
      setGrantModalOpen(false);
      setGrantForm({ planCode: 'starter_30', daysValid: '', endDate: '', adminNote: '' });
      await fetchUserSubscription(searchedUser._id);
      await fetchSubscriptionHistory(searchedUser._id);
    } catch (error: any) {
      console.error('Error granting subscription:', error);
      notify.error(error.response?.data?.message || 'Failed to grant subscription');
    }
  };

  const handleRevoke = async () => {
    if (!searchedUser) return;

    try {
      await api.post('/api/admin/subscriptions/revoke', {
        userId: searchedUser._id,
        reason: revokeForm.reason,
      });
      notify.success('Subscription revoked successfully');
      setRevokeModalOpen(false);
      setRevokeForm({ reason: '' });
      await fetchUserSubscription(searchedUser._id);
      await fetchSubscriptionHistory(searchedUser._id);
    } catch (error: any) {
      console.error('Error revoking subscription:', error);
      notify.error(error.response?.data?.message || 'Failed to revoke subscription');
    }
  };

  const handleUpdate = async () => {
    if (!searchedUser) return;

    try {
      const payload: any = {
        userId: searchedUser._id,
      };

      if (updateForm.planCode) {
        payload.planCode = updateForm.planCode;
      }
      if (updateForm.extendDays) {
        payload.extendDays = parseInt(updateForm.extendDays);
      }
      if (updateForm.adminNote) {
        payload.adminNote = updateForm.adminNote;
      }

      // Validate that at least one field is provided
      if (!payload.planCode && !payload.extendDays && !payload.adminNote) {
        notify.error('Please provide at least one field to update');
        return;
      }

      await api.post('/api/admin/subscriptions/update', payload);
      notify.success('Subscription updated successfully');
      setUpdateModalOpen(false);
      setUpdateForm({ planCode: '', extendDays: '', adminNote: '' });
      await fetchUserSubscription(searchedUser._id);
      await fetchSubscriptionHistory(searchedUser._id);
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      notify.error(error.response?.data?.message || 'Failed to update subscription');
    }
  };

  const handleAddNote = async () => {
    if (!searchedUser || !subscription) return;

    try {
      if (!noteForm.note.trim()) {
        notify.error('Please enter a note');
        return;
      }

      await api.post('/api/admin/subscriptions/update', {
        userId: searchedUser._id,
        adminNote: noteForm.note,
      });
      notify.success('Note added successfully');
      setNoteModalOpen(false);
      setNoteForm({ note: '' });
      await fetchUserSubscription(searchedUser._id);
      await fetchSubscriptionHistory(searchedUser._id);
    } catch (error: any) {
      console.error('Error adding note:', error);
      notify.error(error.response?.data?.message || 'Failed to add note');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
      expired: 'bg-gray-500/20 text-gray-400',
      manually_granted: 'bg-blue-500/20 text-blue-400',
    };

    return (
      <span
        className={`px-2 py-1 rounded text-sm ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}
      >
        {status}
      </span>
    );
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6" style={{ position: 'relative', zIndex: 1 }}>
      <h1 className="text-3xl font-bold text-text-primary">Subscription Management</h1>

      {/* Search Section */}
      <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Search User</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchUser()}
            placeholder="Enter user email or ID"
            className="flex-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
          />
          <button
            onClick={searchUser}
            disabled={searching}
            className="px-6 py-2 bg-primary-500 text-black rounded-lg hover:bg-primary-600 disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {searchedUser && (
        <>
          {/* User Info */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">User Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-text-secondary text-sm">Email</p>
                <p className="text-text-primary font-medium">{searchedUser.email}</p>
              </div>
              <div>
                <p className="text-text-secondary text-sm">Current Plan</p>
                <p className="text-text-primary font-medium">
                  {searchedUser.plan || 'No plan'}
                </p>
              </div>
              <div>
                <p className="text-text-secondary text-sm">Plan Expires</p>
                <p className="text-text-primary font-medium">
                  {formatDate(searchedUser.planExpiresAt)}
                </p>
              </div>
              <div>
                <p className="text-text-secondary text-sm">Lifetime</p>
                <p className="text-text-primary font-medium">
                  {searchedUser.isLifetime ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">Loading subscription...</p>
            </div>
          ) : subscription ? (
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6" style={{ position: 'relative', zIndex: 10 }}>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Current Subscription</h2>
                <div className="flex gap-2 relative z-10" style={{ pointerEvents: 'auto' }}>
                  <button
                    onClick={() => setUpdateModalOpen(true)}
                    className="px-4 py-2 bg-primary-500 text-black rounded-lg hover:bg-primary-600 relative z-10"
                    type="button"
                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setRevokeModalOpen(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 relative z-10"
                    type="button"
                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  >
                    Revoke
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-text-secondary text-sm">Plan</p>
                  <p className="text-text-primary font-medium">{subscription.planName}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Status</p>
                  {getStatusBadge(subscription.status)}
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Start Date</p>
                  <p className="text-text-primary font-medium">{formatDate(subscription.startDate)}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">End Date</p>
                  <p className="text-text-primary font-medium">
                    {subscription.endDate ? formatDate(subscription.endDate) : 'Lifetime'}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Amount Paid</p>
                  <p className="text-text-primary font-medium">
                    {formatCurrency(subscription.amountPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Source</p>
                  <p className="text-text-primary font-medium capitalize">{subscription.source}</p>
                </div>
                {subscription.adminNote && (
                  <div className="col-span-2">
                    <p className="text-text-secondary text-sm">Admin Note</p>
                    <p className="text-text-primary">{subscription.adminNote}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center">
                <p className="text-text-secondary">No active subscription found</p>
                <button
                  onClick={() => setGrantModalOpen(true)}
                  className="px-4 py-2 bg-primary-500 text-black rounded-lg hover:bg-primary-600"
                >
                  Grant Plan
                </button>
              </div>
            </div>
          )}

          {/* Actions Panel */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6 relative z-10" style={{ pointerEvents: 'auto' }}>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ pointerEvents: 'auto' }}>
              <button
                onClick={() => setGrantModalOpen(true)}
                className="px-4 py-3 bg-primary-500 text-black rounded-lg hover:bg-primary-600 transition-colors relative z-10"
                type="button"
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                Grant Plan
              </button>
              <button
                onClick={() => {
                  if (subscription) {
                    setUpdateModalOpen(true);
                  } else {
                    notify.error('No active subscription found');
                  }
                }}
                disabled={!subscription}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative z-10"
                type="button"
                style={{ cursor: subscription ? 'pointer' : 'not-allowed', pointerEvents: subscription ? 'auto' : 'none' }}
              >
                Upgrade/Extend
              </button>
              <button
                onClick={() => {
                  if (subscription) {
                    setRevokeModalOpen(true);
                  } else {
                    notify.error('No active subscription found');
                  }
                }}
                disabled={!subscription}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative z-10"
                type="button"
                style={{ cursor: subscription ? 'pointer' : 'not-allowed', pointerEvents: subscription ? 'auto' : 'none' }}
              >
                Revoke Plan
              </button>
              <button
                onClick={() => {
                  if (subscription) {
                    setNoteModalOpen(true);
                  } else {
                    notify.error('No active subscription found');
                  }
                }}
                disabled={!subscription}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative z-10"
                type="button"
                style={{ cursor: subscription ? 'pointer' : 'not-allowed', pointerEvents: subscription ? 'auto' : 'none' }}
              >
                Add Note
              </button>
            </div>
          </div>

          {/* History Timeline */}
          <div className="bg-surface-raised border border-border-default rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Subscription History</h2>
            {loadingHistory ? (
              <div className="text-center py-8">
                <p className="text-text-secondary">Loading history...</p>
              </div>
            ) : subscriptionHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-secondary">No history found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptionHistory.map((sub) => (
                  <div key={sub.id} className="border-l-2 border-border-default pl-4 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-text-primary font-medium">{sub.planName}</p>
                        <p className="text-text-secondary text-sm">
                          {formatDate(sub.startDate)} - {sub.endDate ? formatDate(sub.endDate) : 'Lifetime'}
                        </p>
                        <p className="text-text-secondary text-sm">Status: {sub.status}</p>
                      </div>
                      {getStatusBadge(sub.status)}
                    </div>
                    {sub.history && sub.history.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {sub.history.map((event, idx) => (
                          <div key={idx} className="text-sm text-text-secondary">
                            <span className="font-medium">{event.action}</span> -{' '}
                            {formatDate(event.timestamp)}
                            {event.notes && <span className="ml-2">({event.notes})</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Grant Modal */}
      <Transition appear show={grantModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setGrantModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-surface-raised border border-border-default p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-text-primary">
                    Grant Subscription
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Plan
                      </label>
                      <select
                        value={grantForm.planCode}
                        onChange={(e) => setGrantForm({ ...grantForm, planCode: e.target.value })}
                        className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
                      >
                        <option value="starter_30">Starter Monthly</option>
                        <option value="growth_90">Growth Quarterly</option>
                        <option value="lifetime">Lifetime</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Days Valid (optional)
                      </label>
                      <input
                        type="number"
                        value={grantForm.daysValid}
                        onChange={(e) => setGrantForm({ ...grantForm, daysValid: e.target.value })}
                        className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
                        placeholder="Leave empty for plan default"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        End Date (optional)
                      </label>
                      <input
                        type="date"
                        value={grantForm.endDate}
                        onChange={(e) => setGrantForm({ ...grantForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Admin Note (optional)
                      </label>
                      <textarea
                        value={grantForm.adminNote}
                        onChange={(e) => setGrantForm({ ...grantForm, adminNote: e.target.value })}
                        className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={handleGrant}
                      className="flex-1 px-4 py-2 bg-primary-500 text-black rounded-lg hover:bg-primary-600"
                    >
                      Grant
                    </button>
                    <button
                      onClick={() => setGrantModalOpen(false)}
                      className="flex-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary hover:bg-surface-hover"
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Revoke Modal */}
      <ConfirmModal
        isOpen={revokeModalOpen}
        title="Revoke Subscription"
        message="Are you sure you want to revoke this subscription?"
        confirmText="Revoke"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleRevoke}
        onClose={() => setRevokeModalOpen(false)}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Reason (optional)
          </label>
          <textarea
            value={revokeForm.reason}
            onChange={(e) => setRevokeForm({ reason: e.target.value })}
            className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
            rows={3}
          />
        </div>
      </ConfirmModal>

      {/* Update Modal */}
      <Transition appear show={updateModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setUpdateModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-surface-raised border border-border-default p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-text-primary">
                    Update Subscription
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Upgrade to Plan (optional)
                      </label>
                      <select
                        value={updateForm.planCode}
                        onChange={(e) => setUpdateForm({ ...updateForm, planCode: e.target.value })}
                        className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
                      >
                        <option value="">No change</option>
                        <option value="starter_30">Starter Monthly</option>
                        <option value="growth_90">Growth Quarterly</option>
                        <option value="lifetime">Lifetime</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Extend by Days (optional)
                      </label>
                      <input
                        type="number"
                        value={updateForm.extendDays}
                        onChange={(e) => setUpdateForm({ ...updateForm, extendDays: e.target.value })}
                        className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
                        placeholder="Number of days to extend"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Admin Note (optional)
                      </label>
                      <textarea
                        value={updateForm.adminNote}
                        onChange={(e) => setUpdateForm({ ...updateForm, adminNote: e.target.value })}
                        className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={handleUpdate}
                      className="flex-1 px-4 py-2 bg-primary-500 text-black rounded-lg hover:bg-primary-600"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => setUpdateModalOpen(false)}
                      className="flex-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary hover:bg-surface-hover"
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Add Note Modal */}
      <Transition appear show={noteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setNoteModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-surface-raised border border-border-default p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-text-primary">
                    Add Admin Note
                  </Dialog.Title>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Note
                    </label>
                    <textarea
                      value={noteForm.note}
                      onChange={(e) => setNoteForm({ note: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary"
                      rows={4}
                      placeholder="Enter admin note..."
                    />
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={handleAddNote}
                      className="flex-1 px-4 py-2 bg-primary-500 text-black rounded-lg hover:bg-primary-600"
                    >
                      Add Note
                    </button>
                    <button
                      onClick={() => setNoteModalOpen(false)}
                      className="flex-1 px-4 py-2 bg-surface-base border border-border-default rounded-lg text-text-primary hover:bg-surface-hover"
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

