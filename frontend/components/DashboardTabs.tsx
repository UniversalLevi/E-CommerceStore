'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function DashboardTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const isEazyStoresTab =
    pathname === '/dashboard/stores' || (pathname?.startsWith('/dashboard/store') ?? false);

  return (
    <div className="w-full flex justify-center px-4 md:px-6 pt-2 md:pt-3 pb-0.5">
      <nav
        className="flex gap-3 md:gap-4 max-w-fit"
        aria-label="Dashboard sections"
        role="tablist"
      >
        {/* EazyDS Tab */}
        {!isEazyStoresTab ? (
          <button
            type="button"
            role="tab"
            onClick={() => router.push('/dashboard')}
            aria-current="page"
            aria-selected={true}
            className="px-4 md:px-6 lg:px-8 py-2.5 md:py-3 lg:py-4 rounded-full text-sm md:text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 transition-all duration-300"
          >
            EazyDS
          </button>
        ) : (
          <button
            type="button"
            role="tab"
            onClick={() => router.push('/dashboard')}
            aria-selected={false}
            className="group relative px-4 md:px-6 lg:px-8 py-2.5 md:py-3 lg:py-4 rounded-full text-sm md:text-base font-semibold transition-all duration-300"
          >
            {/* Gradient border wrapper */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-[2px] shadow-[0_0_15px_rgba(124,58,237,0.2)] group-hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] transition-shadow duration-300">
              <div className="w-full h-full bg-surface-raised rounded-full flex items-center justify-center"></div>
            </div>
            {/* Content */}
            <span className="relative z-10 text-white whitespace-nowrap">EazyDS</span>
            {/* Sparkle effect on hover */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-pulse"></div>
              <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </button>
        )}

        {/* Eazy Stores Tab */}
        {isEazyStoresTab ? (
          <button
            type="button"
            role="tab"
            onClick={() => router.push('/dashboard/stores')}
            aria-current="page"
            aria-selected={true}
            className="px-4 md:px-6 lg:px-8 py-2.5 md:py-3 lg:py-4 rounded-full text-sm md:text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 transition-all duration-300"
          >
            Eazy Stores
          </button>
        ) : (
          <button
            type="button"
            role="tab"
            onClick={() => router.push('/dashboard/stores')}
            aria-selected={false}
            className="group relative px-4 md:px-6 lg:px-8 py-2.5 md:py-3 lg:py-4 rounded-full text-sm md:text-base font-semibold transition-all duration-300"
          >
            {/* Gradient border wrapper */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-[2px] shadow-[0_0_15px_rgba(124,58,237,0.2)] group-hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] transition-shadow duration-300">
              <div className="w-full h-full bg-surface-raised rounded-full flex items-center justify-center"></div>
            </div>
            {/* Content */}
            <span className="relative z-10 text-white whitespace-nowrap">Eazy Stores</span>
            {/* Sparkle effect on hover */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-pulse"></div>
              <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </button>
        )}
      </nav>
    </div>
  );
}
