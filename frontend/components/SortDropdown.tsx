'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

type SortMode = 'popularity' | 'newest' | 'price_low_to_high' | 'price_high_to_low';

interface SortDropdownProps {
  defaultSort?: SortMode;
}

const sortOptions: { value: SortMode; label: string }[] = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_low_to_high', label: 'Price: Low to High' },
  { value: 'price_high_to_low', label: 'Price: High to Low' },
];

export default function SortDropdown({ defaultSort = 'newest' }: SortDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = (searchParams.get('sort') as SortMode) || defaultSort;
  const [isOpen, setIsOpen] = useState(false);

  const updateSort = (sort: SortMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    params.set('page', '1'); // Reset to first page when sorting changes
    router.push(`?${params.toString()}`);
    setIsOpen(false);
  };

  const currentLabel = sortOptions.find((opt) => opt.value === currentSort)?.label || 'Newest';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 hover:border-primary-500 transition-colors"
      >
        <span>Sort: {currentLabel}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateSort(option.value)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  currentSort === option.value
                    ? 'bg-primary-600 text-white'
                    : 'text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}




