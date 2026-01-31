'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import Button from '@/components/Button';
import { formatCurrency } from '@/lib/affiliate';
import { AffiliatePayout } from '@/types/affiliate';

interface PayoutApprovalModalProps {
  payout: AffiliatePayout;
  affiliateId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PayoutApprovalModal({
  payout,
  affiliateId,
  onClose,
  onSuccess,
}: PayoutApprovalModalProps) {
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
    // Fetch commissions included in this payout
    const fetchCommissions = async () => {
      try {
        const response = await api.get(`/api/admin/affiliates/${affiliateId}/commissions`);
        if (response.success && response.data) {
          // Filter commissions that are approved and ready for payout
          const readyCommissions = response.data.commissions?.filter(
            (c: any) => c.status === 'approved' && !c.isRefunded
          ) || [];
          setCommissions(readyCommissions);
        }
      } catch (error) {
        console.error('Failed to fetch commissions:', error);
      }
    };

    fetchCommissions();
  }, [affiliateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = action === 'approve'
        ? `/api/admin/affiliates/${affiliateId}/payout/${payout._id}/approve`
        : `/api/admin/affiliates/${affiliateId}/payout/${payout._id}/reject`;

      const payload: any = {};
      if (action === 'reject') {
        payload.reason = notes || 'No reason provided';
      } else if (notes) {
        payload.notes = notes;
      }

      const response = await api.post(endpoint, payload);

      if (response.success) {
        notify.success(`Payout ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || `Failed to ${action} payout`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {action === 'approve' ? 'Approve' : 'Reject'} Payout
            </h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Payout Summary */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Payout Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Amount:</span>
                  <span className="text-text-primary font-medium">
                    {formatCurrency(payout.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Status:</span>
                  <span className="text-text-primary">{payout.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Requested:</span>
                  <span className="text-text-primary">
                    {new Date(payout.requestedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Commission Breakdown */}
            {commissions.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Commission Breakdown</h3>
                <div className="bg-white/5 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {commissions.slice(0, 10).map((commission: any) => (
                      <div key={commission._id} className="flex justify-between text-sm">
                        <span className="text-text-secondary">
                          {commission.planCode} - {commission.referredUserId?.name || 'Unknown'}
                        </span>
                        <span className="text-text-primary">
                          {formatCurrency(commission.commissionAmount)}
                        </span>
                      </div>
                    ))}
                    {commissions.length > 10 && (
                      <p className="text-text-secondary text-sm mt-2">
                        + {commissions.length - 10} more commissions
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Action
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as any)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text-primary"
                >
                  <option value="approve">Approve Payout</option>
                  <option value="reject">Reject Payout</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {action === 'reject' ? 'Rejection Reason' : 'Notes'} {action === 'reject' && '*'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text-primary resize-none"
                  placeholder={action === 'reject' ? 'Reason for rejection...' : 'Add notes (optional)...'}
                  required={action === 'reject'}
                />
              </div>

              {action === 'approve' && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm">
                    This will credit {formatCurrency(payout.amount)} to the affiliate's wallet and mark all related commissions as paid.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  variant={action === 'reject' ? 'danger' : 'primary'}
                  className="flex-1"
                >
                  {action === 'approve' ? 'Approve Payout' : 'Reject Payout'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
