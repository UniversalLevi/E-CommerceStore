import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/Toaster'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'

const inter = Inter({ subsets: ['latin'] })
const playfairDisplay = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'EAZY DROPSHIPPING',
  description: 'Build Shopify stores in minutes',
  openGraph: {
    title: 'EAZY DROPSHIPPING',
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
      <body className={`${inter.className} ${playfairDisplay.variable} relative`}>
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

