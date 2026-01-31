'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import Button from '@/components/Button';
import { formatCurrency } from '@/lib/affiliate';

interface CommissionAdjustModalProps {
  commissionId: string;
  affiliateId: string;
  currentAmount?: number;
  currentStatus?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CommissionAdjustModal({
  commissionId,
  affiliateId,
  currentAmount,
  currentStatus,
  onClose,
  onSuccess,
}: CommissionAdjustModalProps) {
  const [action, setAction] = useState<'approve' | 'revoke' | 'adjust_amount'>('approve');
  const [amount, setAmount] = useState(currentAmount ? (currentAmount / 100).toString() : '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (action === 'adjust_amount' && !amount) {
        notify.error('Please enter an amount');
        setLoading(false);
        return;
      }

      const payload: any = {
        action,
      };

      if (action === 'adjust_amount') {
        payload.amount = Math.round(parseFloat(amount) * 100); // Convert to paise
      }

      if (notes) {
        payload.notes = notes;
      }

      const response = await api.post(
        `/api/admin/affiliates/${affiliateId}/commission/${commissionId}/adjust`,
        payload
      );

      if (response.success) {
        notify.success(`Commission ${action === 'approve' ? 'approved' : action === 'revoke' ? 'revoked' : 'adjusted'} successfully`);
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Failed to adjust commission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card border border-white/10 rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Adjust Commission</h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

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
                <option value="approve">Approve</option>
                <option value="revoke">Revoke</option>
                <option value="adjust_amount">Adjust Amount</option>
              </select>
            </div>

            {action === 'adjust_amount' && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  New Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={currentAmount ? formatCurrency(currentAmount) : '0.00'}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text-primary"
                  required
                />
                {currentAmount && (
                  <p className="mt-1 text-sm text-text-secondary">
                    Current: {formatCurrency(currentAmount)}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text-primary resize-none"
                placeholder="Add notes about this action..."
              />
            </div>

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
                className="flex-1"
              >
                {action === 'approve' ? 'Approve' : action === 'revoke' ? 'Revoke' : 'Adjust'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
