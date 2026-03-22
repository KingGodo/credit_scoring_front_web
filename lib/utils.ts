import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

// ── Tailwind class merger ─────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Currency formatter ────────────────────────────────────────────────────
export function formatCurrency(
  amount:   number | string,
  currency  = 'USD',
  locale    = 'en-US'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat(locale, {
    style:                 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

// ── Date formatters ───────────────────────────────────────────────────────
export function formatDate(
  date: string | Date | null,
  fmt  = 'dd MMM yyyy'
): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt)
  } catch {
    return '—'
  }
}

export function formatDateTime(date: string | Date | null): string {
  return formatDate(date, 'dd MMM yyyy, HH:mm')
}

export function formatRelativeTime(date: string | Date | null): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return '—'
  }
}

// ── Number helpers ────────────────────────────────────────────────────────
export function formatPercent(value: number, decimals = 1): string {
  if (isNaN(value)) return '—'
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

// ── String helpers ────────────────────────────────────────────────────────
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function titleCase(str: string): string {
  return str
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => capitalize(w))
    .join(' ')
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return `${str.slice(0, length)}…`
}

// ── Status label helpers ──────────────────────────────────────────────────
export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
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
  }
  return map[status] ?? titleCase(status)
}

export function getRiskLabel(risk: string): string {
  const map: Record<string, string> = {
    low:       'Low Risk',
    medium:    'Medium Risk',
    high:      'High Risk',
    very_high: 'Very High Risk',
  }
  return map[risk] ?? titleCase(risk)
}

export function getDocTypeLabel(type: string): string {
  const map: Record<string, string> = {
    national_id:         'National ID',
    passport:            'Passport',
    drivers_license:     "Driver's License",
    proof_of_address:    'Proof of Address',
    business_license:    'Business License',
    selfie_verification: 'Selfie Verification',
  }
  return map[type] ?? titleCase(type)
}