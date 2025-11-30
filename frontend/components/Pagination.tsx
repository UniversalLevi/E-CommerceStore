'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total?: number;
  limit?: number;
  /** Optional callback; if provided, caller is responsible for handling page changes */
  onPageChange?: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updatePage = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  const hasSummary = typeof total === 'number' && typeof limit === 'number' && limit > 0;
  const startItem = hasSummary ? (currentPage - 1) * (limit as number) + 1 : 0;
  const endItem = hasSummary ? Math.min(currentPage * (limit as number), total as number) : 0;

  // Generate page numbers (max 10 visible)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 10;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      {hasSummary && (
        <div className="text-text-secondary text-sm">
          Showing {startItem}-{endItem} of {total} products
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => updatePage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-lg border transition-all ${
            currentPage === 1
              ? 'bg-white/5 border-white/10 text-text-muted cursor-not-allowed'
              : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-purple-500/50'
          }`}
        >
          Previous
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-2">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="text-text-muted px-2">
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => updatePage(pageNum)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 border-transparent text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-purple-500/50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => updatePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-lg border transition-all ${
            currentPage === totalPages
              ? 'bg-white/5 border-white/10 text-text-muted cursor-not-allowed'
              : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-purple-500/50'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}






