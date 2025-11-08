import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/Toaster'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Auto Shopify Store Builder',
  description: 'Build Shopify stores in minutes',
  openGraph: {
    title: 'Auto Shopify Store Builder',
    description: 'Build Shopify stores in minutes',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AppErrorBoundary>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </AppErrorBoundary>
      </body>
    </html>
  )
}

