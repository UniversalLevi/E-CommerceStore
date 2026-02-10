/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Configure Server Actions properly to prevent errors
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: process.env.NEXT_PUBLIC_API_URL 
        ? [new URL(process.env.NEXT_PUBLIC_API_URL).origin]
        : ['https://eazyds.com', 'http://localhost:3000'],
    },
  },
  // Ensure proper headers for production
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig

