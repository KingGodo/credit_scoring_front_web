import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/types'

const riskStyles: Record<RiskLevel, string> = {
  low:
    'bg-[rgb(var(--risk-low-bg))] text-[rgb(var(--risk-low-text))]',
  medium:
    'bg-[rgb(var(--risk-medium-bg))] text-[rgb(var(--risk-medium-text))]',
  high:
    'bg-[rgb(var(--risk-high-bg))] text-[rgb(var(--risk-high-text))]',
  very_high:
    'bg-[rgb(var(--risk-very-high-bg))] text-[rgb(var(--risk-very-high-text))]',
}

const riskLabels: Record<RiskLevel, string> = {
  low:       'Low Risk',
  medium:    'Medium Risk',
  high:      'High Risk',
  very_high: 'Very High Risk',
}

const riskDots: Record<RiskLevel, string> = {
  low:       'bg-muted-foreground/35',
  medium:    'bg-muted-foreground/55',
  high:      'bg-muted-foreground/75',
  very_high: 'bg-foreground',
}

interface RiskBadgeProps {
  risk:        RiskLevel
  showLabel?:  boolean
  className?:  string
}

export function RiskBadge({
  risk,
  showLabel = true,
  className,
}: RiskBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
        'text-xs font-medium',
        riskStyles[risk],
        className
      )}
    >
      <span
        className={cn(
          'inline-block h-1.5 w-1.5 rounded-full',
          riskDots[risk]
        )}
      />
      {showLabel && riskLabels[risk]}
    </span>
  )
}