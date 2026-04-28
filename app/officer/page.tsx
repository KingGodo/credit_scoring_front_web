'use client'

import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
} from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingPage } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import api from '@/lib/axios'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type {
  LoanApplication,
  Loan,
  Borrower,
  RepaymentSchedule,
} from '@/types'

// ═════════════════════════════════════════════════════════════════════════
export default function OfficerDashboardPage() {

  // ── Data fetching ───────────────────────────────────────────────────
  const { data: applications = [], isLoading: appsLoading } =
    useQuery({
      queryKey: ['officer-applications'],
      queryFn:  () =>
        api.get('/loan-applications').then(r => r.data.data as LoanApplication[]),
    })

  const { data: loans = [], isLoading: loansLoading } =
    useQuery({
      queryKey: ['officer-loans'],
      queryFn:  () =>
        api.get('/loans').then(r => r.data.data as Loan[]),
    })

  const { data: borrowers = [], isLoading: borrowersLoading } =
    useQuery({
      queryKey: ['officer-borrowers'],
      queryFn:  () =>
        api.get('/borrowers').then(r => r.data.data as Borrower[]),
    })

  const { data: overdueSchedules = [], isLoading: overdueLoading } =
    useQuery({
      queryKey: ['overdue-schedules'],
      queryFn:  () =>
        api
          .get('/repayment-schedules/overdue')
          .then(r => r.data.data as RepaymentSchedule[]),
    })

  const isLoading =
    appsLoading || loansLoading || borrowersLoading || overdueLoading

  if (isLoading) return <LoadingPage />

  // ── Derived stats ───────────────────────────────────────────────────
  const pendingApps    = applications.filter(a => a.application_status === 'pending')
  const reviewApps     = applications.filter(a => a.application_status === 'under_review')
  const activeLoans    = loans.filter(l => l.loan_status === 'active')
  const lateLoans      = loans.filter(l => l.loan_status === 'late')
  const recentApps     = applications.slice(0, 6)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your loan officer overview — pending reviews and overdue payments."
      />

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Pending Applications"
          value={pendingApps.length}
          subtitle="Awaiting review"
          icon={ClipboardList}
        />
        <StatsCard
          title="Under Review"
          value={reviewApps.length}
          subtitle="Being processed"
          icon={Clock}
        />
        <StatsCard
          title="Active Loans"
          value={activeLoans.length}
          subtitle={`${lateLoans.length} late`}
          icon={CreditCard}
        />
        <StatsCard
          title="Overdue Installments"
          value={overdueSchedules.length}
          subtitle="Need attention"
          icon={AlertTriangle}
        />
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Pending applications */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Pending Applications
              </h3>
              <p className="text-xs text-muted-foreground">
                Applications waiting for your review
              </p>
            </div>
            <Link
              href="/officer/loan-applications"
              className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="divide-y divide-border">
            {recentApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <CheckCircle className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  All clear!
                </p>
                <p className="text-xs text-muted-foreground">
                  No pending applications
                </p>
              </div>
            ) : (
              recentApps.map((app) => (
                <Link
                  key={app.application_id}
                  href={`/officer/loan-applications/${app.application_id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {app.first_name && app.last_name
                        ? `${app.first_name} ${app.last_name}`
                        : app.borrower_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(app.requested_amount)} ·{' '}
                      {app.requested_term} months ·{' '}
                      {app.product_name}
                    </p>
                  </div>
                  <StatusBadge status={app.application_status} size="sm" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Overdue installments */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Overdue Installments
              </h3>
              <p className="text-xs text-muted-foreground">
                Missed payment deadlines
              </p>
            </div>
            <Link
              href="/officer/repayment-schedules"
              className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="divide-y divide-border">
            {overdueSchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <CheckCircle className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  No overdue payments
                </p>
                <p className="text-xs text-muted-foreground">
                  All installments are on track
                </p>
              </div>
            ) : (
              overdueSchedules.slice(0, 6).map((s) => (
                <div
                  key={s.schedule_id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground font-mono">
                      Installment #{s.installment_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {formatDate(s.due_date)} ·{' '}
                      {formatCurrency(s.amount_due)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                      'bg-red-500/10 text-red-600 dark:text-red-400'
                    )}
                  >
                    Overdue
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}