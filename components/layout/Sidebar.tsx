'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  Package,
  FileText,
  CreditCard,
  Calendar,
  Banknote,
  Brain,
  Cpu,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────
interface NavItem {
  label: string
  href:  string
  icon:  React.ElementType
}

interface NavGroup {
  label: string
  items: NavItem[]
}

// ── Admin nav ─────────────────────────────────────────────────────────────
const adminNav: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard',      href: '/admin',                 icon: LayoutDashboard },
    ],
  },
  {
    label: 'Organization',
    items: [
      { label: 'Lenders',        href: '/admin/lenders',         icon: Building2 },
      { label: 'Lender Staff',   href: '/admin/lender-staff',    icon: UserCheck },
      { label: 'Users',          href: '/admin/users',           icon: Users },
    ],
  },
  {
    label: 'Loan Products',
    items: [
      { label: 'Products',       href: '/admin/loan-products',   icon: Package },
    ],
  },
  {
    label: 'Machine Learning',
    items: [
      { label: 'Model Versions', href: '/admin/model-versions',  icon: Cpu },
      { label: 'Predictions',    href: '/admin/prediction-runs', icon: Brain },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Audit Logs',     href: '/admin/audit-logs',      icon: ClipboardList },
    ],
  },
]

// ── Loan Officer nav ──────────────────────────────────────────────────────
const officerNav: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard',      href: '/officer',                     icon: LayoutDashboard },
    ],
  },
  {
    label: 'Borrowers',
    items: [
      { label: 'Borrowers',      href: '/officer/borrowers',           icon: Users },
      { label: 'KYC Documents',  href: '/officer/borrower-documents',  icon: FileText },
    ],
  },
  {
    label: 'Loans',
    items: [
      { label: 'Applications',   href: '/officer/loan-applications',   icon: ClipboardList },
      { label: 'Loans',          href: '/officer/loans',               icon: CreditCard },
    ],
  },
  {
    label: 'Repayments',
    items: [
      { label: 'Schedules',      href: '/officer/repayment-schedules', icon: Calendar },
      { label: 'Repayments',     href: '/officer/repayments',          icon: Banknote },
    ],
  },
]

// ── Component ─────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname            = usePathname()
  const router              = useRouter()
  const { user, logout }    = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  const navGroups = user?.role === 'admin' ? adminNav : officerNav

  const handleLogout = () => {
    logout()
    toast.success('Signed out successfully')
    router.replace('/login')
  }

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/officer') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col',
        'bg-sidebar border-r border-sidebar-border',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[64px]' : 'w-[240px]'
      )}
    >

      {/* Logo */}
      <div
        className={cn(
          'flex h-16 items-center border-b border-sidebar-border px-4',
          collapsed ? 'justify-center' : 'gap-3'
        )}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent">
          <TrendingUp className="h-4 w-4 text-sidebar-foreground" strokeWidth={2} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              LoanApp
            </p>
            <p className="truncate text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
              {user?.role === 'admin' ? 'Administrator' : 'Loan Officer'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">

            {/* Group label */}
            {!collapsed && (
              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                {group.label}
              </p>
            )}

            {/* Nav items */}
            {group.items.map((item) => {
              const active = isActive(item.href)
              const Icon   = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'group relative mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5',
                    'text-sm transition-all duration-150',
                    collapsed && 'justify-center px-0',
                    active
                      ? 'bg-sidebar-accent text-sidebar-foreground'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                  )}
                >
                  {/* Active bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-foreground" />
                  )}

                  <Icon
                    className={cn(
                      'h-4 w-4 flex-shrink-0 transition-colors',
                      active
                        ? 'text-sidebar-foreground'
                        : 'text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80'
                    )}
                    strokeWidth={active ? 2 : 1.75}
                  />

                  {!collapsed && (
                    <span className="truncate font-medium">{item.label}</span>
                  )}

                  {/* Tooltip when collapsed */}
                  {collapsed && (
                    <div className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-lg group-hover:block">
                      {item.label}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom — user info + logout */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        {!collapsed && (
          <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-accent text-xs font-semibold text-sidebar-foreground">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {user?.email}
              </p>
              <p className="text-[10px] capitalize text-sidebar-foreground/40">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5',
            'text-sm text-sidebar-foreground/50 transition-colors',
            'hover:bg-sidebar-accent hover:text-sidebar-foreground',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'absolute -right-3 top-20 z-10',
          'flex h-6 w-6 items-center justify-center',
          'rounded-full border border-sidebar-border bg-sidebar',
          'text-sidebar-foreground/40 shadow-sm',
          'hover:text-sidebar-foreground transition-colors'
        )}
      >
        {collapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft  className="h-3 w-3" />}
      </button>
    </aside>
  )
}