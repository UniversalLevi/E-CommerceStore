import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Skip middleware for Next.js internal routes and API routes
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('_rsc') ||
    url.pathname === '/favicon.ico' ||
    url.pathname.startsWith('/_vercel')
  ) {
    return NextResponse.next();
  }

  // Check if this is a subdomain request (e.g., {store-slug}.eazydropshipping.com)
  // In development, you might use localhost:3000 with a subdomain setup
  // In production, this would be {store-slug}.eazydropshipping.com
  const subdomainMatch = hostname.match(/^([^.]+)\.(eazydropshipping\.com|localhost)/);
  
  if (subdomainMatch && subdomainMatch[1] !== 'www' && subdomainMatch[1] !== 'api') {
    const storeSlug = subdomainMatch[1];
    
    // Only rewrite if not already a storefront route
    if (!url.pathname.startsWith('/storefront/')) {
      // Rewrite to storefront route, preserving query parameters
      url.pathname = `/storefront/${storeSlug}${url.pathname === '/' ? '' : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Path-based fallback: /storefront/[slug] works without subdomain
  // This allows access via https://eazydropshipping.com/storefront/teststore
  // when DNS isn't configured yet
  if (url.pathname.startsWith('/storefront/')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - _rsc (React Server Components)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|_rsc).*)',
  ],
};
