'use client';

interface SkeletonLoaderProps {
  className?: string;
}

export function SkeletonLoader({ className = '' }: SkeletonLoaderProps) {
  return (
    <div className={`animate-pulse bg-gray-700 rounded ${className}`}></div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md overflow-hidden">
      <SkeletonLoader className="aspect-square w-full bg-gray-700" />
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
    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md p-6">
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

