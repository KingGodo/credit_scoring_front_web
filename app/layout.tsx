import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { AppProviders } from '@/components/layout/AppProviders'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default:  'LoanApp — Credit Scoring System',
    template: '%s | LoanApp',
  },
  description:
    'Ensemble machine learning credit scoring and loan management system for Zimbabwe\'s informal sector.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}