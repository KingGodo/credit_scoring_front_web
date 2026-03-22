'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

// ── Route label map ───────────────────────────────────────────────────────
const routeLabels: Record<string, string> = {
  admin:                  'Dashboard',
  officer:                'Dashboard',
  users:                  'Users',
  lenders:                'Lenders',
  'lender-staff':         'Lender Staff',
  'loan-products':        'Loan Products',
  'model-versions':       'Model Versions',
  'prediction-runs':      'Predictions',
  'audit-logs':           'Audit Logs',
  borrowers:              'Borrowers',
  'borrower-documents':   'KYC Documents',
  'loan-applications':    'Loan Applications',
  loans:                  'Loans',
  'repayment-schedules':  'Repayment Schedules',
  repayments:             'Repayments',
}

function useBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return segments.map((seg, i) => {
    const href   = '/' + segments.slice(0, i + 1).join('/')
    const label  = routeLabels[seg] ?? seg.replace(/-/g, ' ')
    const isLast = i === segments.length - 1
    return { href, label, isLast }
  })
}

// ── Theme toggle ──────────────────────────────────────────────────────────
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    const root = document.documentElement
    if (isDark) {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg',
        'text-muted-foreground hover:text-foreground hover:bg-muted',
        'transition-colors'
      )}
    >
      {isDark
        ? <Sun  className="h-4 w-4" />
        : <Moon className="h-4 w-4" />}
    </button>
  )
}

// ── Component ─────────────────────────────────────────────────────────────
export function Header() {
  const router           = useRouter()
  const { user, logout } = useAuthStore()
  const breadcrumbs      = useBreadcrumbs()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef          = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('Signed out')
    router.replace('/login')
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-sm">

      {/* Breadcrumbs */}
      <nav className="flex flex-1 items-center gap-1 text-sm min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1 min-w-0">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50" />
            )}
            {crumb.isLast ? (
              <span className="font-medium text-foreground truncate capitalize">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate capitalize"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className={cn(
            'relative flex h-8 w-8 items-center justify-center rounded-lg',
            'text-muted-foreground hover:text-foreground hover:bg-muted',
            'transition-colors'
          )}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-foreground" />
        </button>

        {/* User avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="User menu"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full',
              'border border-border bg-muted text-sm font-semibold text-foreground',
              'ring-2 ring-transparent hover:ring-ring/40',
              'transition-all'
            )}
          >
            {user?.email?.charAt(0).toUpperCase()}
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div
              className={cn(
                'absolute right-0 top-10 z-50 w-56 rounded-xl',
                'border border-border bg-card shadow-card-lg',
                'animate-fade-up p-1'
              )}
            >
              {/* User info */}
              <div className="px-3 py-2.5 border-b border-border mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>

              {/* Profile */}
              <button
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2',
                  'text-sm text-foreground hover:bg-muted transition-colors'
                )}
              >
                <User className="h-4 w-4 text-muted-foreground" />
                Profile settings
              </button>

              <div className="my-1 h-px bg-border" />

              {/* Logout */}
              <button
                onClick={() => { handleLogout(); setMenuOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2',
                  'text-sm text-red-600 dark:text-red-400',
                  'hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors'
                )}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}