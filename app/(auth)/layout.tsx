import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-shell relative min-h-screen w-full">
      <div className="relative flex min-h-screen items-center justify-center p-6">
        {children}
      </div>
    </div>
  )
}
