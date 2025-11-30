'use client';

interface SkeletonLoaderProps {
  className?: string;
}

export function SkeletonLoader({ className = '' }: SkeletonLoaderProps) {
  return (
    <div className={`animate-pulse bg-purple-500/10 rounded relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer-premium bg-gradient-to-r from-transparent via-purple-500/10 to-transparent"></div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <SkeletonLoader className="aspect-square w-full" />
      <div className="p-6">
        <SkeletonLoader className="h-4 w-20 mb-2" />
        <SkeletonLoader className="h-6 w-full mb-2" />
        <SkeletonLoader className="h-4 w-3/4 mb-4" />
        <SkeletonLoader className="h-8 w-24" />
      </div>
    </div>
  );
}

export function StoreCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <SkeletonLoader className="h-6 w-3/4 mb-4" />
      <SkeletonLoader className="h-4 w-full mb-2" />
      <SkeletonLoader className="h-4 w-2/3 mb-4" />
      <div className="flex gap-2">
        <SkeletonLoader className="h-8 w-20" />
        <SkeletonLoader className="h-8 w-20" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-6 py-4">
        <SkeletonLoader className="h-4 w-full" />
      </td>
      <td className="px-6 py-4">
        <SkeletonLoader className="h-4 w-3/4" />
      </td>
      <td className="px-6 py-4">
        <SkeletonLoader className="h-4 w-1/2" />
      </td>
      <td className="px-6 py-4">
        <SkeletonLoader className="h-4 w-1/4" />
      </td>
    </tr>
  );
}

