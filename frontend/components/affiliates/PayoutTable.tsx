'use client';

import { AffiliatePayout } from '@/types/affiliate';
import { formatCurrency, getStatusColor, formatDate } from '@/lib/affiliate';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PayoutTableProps {
  payouts: AffiliatePayout[];
  loading?: boolean;
  onAction?: (payoutId: string, action: string) => void;
  showActions?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function PayoutTable({
  payouts,
  loading = false,
  onAction,
  showActions = false,
  page = 1,
  totalPages = 1,
  onPageChange,
}: PayoutTableProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-2 text-text-secondary">Loading payouts...</p>
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <p>No payouts found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-white/5">
          <tr>
            <th className="text-left py-3 px-4 text-text-secondary font-semibold">Amount</th>
            <th className="text-left py-3 px-4 text-text-secondary font-semibold">Status</th>
            <th className="text-left py-3 px-4 text-text-secondary font-semibold">Requested</th>
            {payouts.some(p => p.approvedAt) && (
              <th className="text-left py-3 px-4 text-text-secondary font-semibold">Approved</th>
            )}
            {payouts.some(p => p.paidAt) && (
              <th className="text-left py-3 px-4 text-text-secondary font-semibold">Paid</th>
            )}
            {showActions && (
              <th className="text-left py-3 px-4 text-text-secondary font-semibold">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {payouts.map((payout) => (
            <tr key={payout._id} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-3 px-4 text-text-primary font-medium">
                {formatCurrency(payout.amount)}
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(payout.status)}`}>
                  {payout.status}
                </span>
              </td>
              <td className="py-3 px-4 text-text-secondary text-sm">
                {formatDate(payout.requestedAt)}
              </td>
              {payouts.some(p => p.approvedAt) && (
                <td className="py-3 px-4 text-text-secondary text-sm">
                  {payout.approvedAt ? formatDate(payout.approvedAt) : '-'}
                </td>
              )}
              {payouts.some(p => p.paidAt) && (
                <td className="py-3 px-4 text-text-secondary text-sm">
                  {payout.paidAt ? formatDate(payout.paidAt) : '-'}
                </td>
              )}
              {showActions && onAction && (
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    {payout.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onAction(payout._id, 'approve')}
                          className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-sm transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onAction(payout._id, 'reject')}
                          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
