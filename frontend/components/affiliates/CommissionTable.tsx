'use client';

import { AffiliateCommission } from '@/types/affiliate';
import { formatCurrency, getStatusColor, formatDate, getPlanDisplayName } from '@/lib/affiliate';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CommissionTableProps {
  commissions: AffiliateCommission[];
  loading?: boolean;
  onAction?: (commissionId: string, action: string) => void;
  showActions?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function CommissionTable({
  commissions,
  loading = false,
  onAction,
  showActions = false,
  page = 1,
  totalPages = 1,
  onPageChange,
}: CommissionTableProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-2 text-text-secondary">Loading commissions...</p>
      </div>
    );
  }

  if (commissions.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <p>No commissions found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-white/5">
          <tr>
            <th className="text-left py-3 px-4 text-text-secondary font-semibold">Plan</th>
            <th className="text-left py-3 px-4 text-text-secondary font-semibold">Referred User</th>
            <th className="text-left py-3 px-4 text-text-secondary font-semibold">Amount</th>
            <th className="text-left py-3 px-4 text-text-secondary font-semibold">Status</th>
            <th className="text-left py-3 px-4 text-text-secondary font-semibold">Date</th>
            {showActions && (
              <th className="text-left py-3 px-4 text-text-secondary font-semibold">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {commissions.map((commission) => {
            const referredUser = typeof commission.referredUserId === 'object' 
              ? commission.referredUserId 
              : null;
            
            return (
              <tr key={commission._id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-3 px-4 text-text-primary">
                  {getPlanDisplayName(commission.planCode)}
                </td>
                <td className="py-3 px-4">
                  {referredUser ? (
                    <div>
                      <div className="text-text-primary font-medium">{referredUser.name}</div>
                      <div className="text-text-secondary text-sm">{referredUser.email}</div>
                    </div>
                  ) : (
                    <span className="text-text-secondary">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-text-primary font-medium">
                  {formatCurrency(commission.commissionAmount)}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(commission.status)}`}>
                    {commission.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-text-secondary text-sm">
                  {formatDate(commission.createdAt)}
                </td>
                {showActions && onAction && (
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {commission.status === 'pending' && (
                        <button
                          onClick={() => onAction(commission._id, 'approve')}
                          className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-sm transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {commission.status !== 'revoked' && commission.status !== 'paid' && (
                        <button
                          onClick={() => onAction(commission._id, 'revoke')}
                          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
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
