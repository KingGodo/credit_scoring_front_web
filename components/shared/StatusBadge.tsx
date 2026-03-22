import { cn } from '@/lib/utils'
import type {
  ApplicationStatus,
  LoanStatus,
  ScheduleStatus,
  VerificationStatus,
} from '@/types'

type Status =
  | ApplicationStatus
  | LoanStatus
  | ScheduleStatus
  | VerificationStatus
  | 'active'
  | 'inactive'
  | string

const statusStyles: Record<string, string> = {
  // Application
  pending:
    'bg-[rgb(var(--status-pending-bg))] text-[rgb(var(--status-pending-text))] border-[rgb(var(--status-pending-border))]',
  under_review:
    'bg-[rgb(var(--status-review-bg))] text-[rgb(var(--status-review-text))] border-[rgb(var(--status-review-border))]',
  approved:
    'bg-[rgb(var(--status-approved-bg))] text-[rgb(var(--status-approved-text))] border-[rgb(var(--status-approved-border))]',
  rejected:
    'bg-[rgb(var(--status-rejected-bg))] text-[rgb(var(--status-rejected-text))] border-[rgb(var(--status-rejected-border))]',

  // Loan
  active:
    'bg-[rgb(var(--status-active-bg))] text-[rgb(var(--status-active-text))] border-[rgb(var(--status-active-border))]',
  completed:
    'bg-[rgb(var(--status-completed-bg))] text-[rgb(var(--status-completed-text))] border-[rgb(var(--status-completed-border))]',
  late:
    'bg-[rgb(var(--status-late-bg))] text-[rgb(var(--status-late-text))] border-[rgb(var(--status-late-border))]',
  defaulted:
    'bg-[rgb(var(--status-defaulted-bg))] text-[rgb(var(--status-defaulted-text))] border-[rgb(var(--status-defaulted-border))]',

  // Schedule
  paid:
    'bg-[rgb(var(--status-approved-bg))] text-[rgb(var(--status-approved-text))] border-[rgb(var(--status-approved-border))]',
  overdue:
    'bg-[rgb(var(--status-rejected-bg))] text-[rgb(var(--status-rejected-text))] border-[rgb(var(--status-rejected-border))]',
  waived:
    'bg-[rgb(var(--status-review-bg))] text-[rgb(var(--status-review-text))] border-[rgb(var(--status-review-border))]',

  // KYC
  verified:
    'bg-[rgb(var(--status-approved-bg))] text-[rgb(var(--status-approved-text))] border-[rgb(var(--status-approved-border))]',

  // Generic
  inactive: 'bg-muted text-muted-foreground border-border',
}

const statusLabels: Record<string, string> = {
  pending:      'Pending',
  under_review: 'Under Review',
  approved:     'Approved',
  rejected:     'Rejected',
  active:       'Active',
  completed:    'Completed',
  late:         'Late',
  defaulted:    'Defaulted',
  paid:         'Paid',
  overdue:      'Overdue',
  waived:       'Waived',
  verified:     'Verified',
  inactive:     'Inactive',
}

interface StatusBadgeProps {
  status:     Status
  size?:      'sm' | 'md'
  className?: string
}

export function StatusBadge({
  status,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const styles =
    statusStyles[status] ??
    'bg-muted text-muted-foreground border-border'

  const label =
    statusLabels[status] ?? status.replace(/_/g, ' ')

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm'
          ? 'px-2 py-0.5 text-[11px]'
          : 'px-2.5 py-0.5 text-xs',
        styles,
        className
      )}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  )
}