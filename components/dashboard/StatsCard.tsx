import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  title:        string
  value:        string | number
  subtitle?:    string
  icon:         LucideIcon
  trend?:       number
  trendLabel?:  string
  iconColor?:   string
  iconBg?:      string
  className?:   string
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  iconColor = 'text-muted-foreground',
  iconBg    = 'bg-muted',
  className,
}: StatsCardProps) {
  const trendUp      = trend !== undefined && trend > 0
  const trendDown    = trend !== undefined && trend < 0
  const trendNeutral = trend !== undefined && trend === 0

  const TrendIcon = trendUp
    ? TrendingUp
    : trendDown
    ? TrendingDown
    : Minus

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5',
        'shadow-card hover:shadow-card-md transition-shadow',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
            {value}
          </p>

          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              {subtitle}
            </p>
          )}

          {/* Trend pill */}
          {trend !== undefined && (
            <div
              className={cn(
                'mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                trendUp      && 'bg-muted text-foreground',
                trendDown    && 'bg-muted text-muted-foreground',
                trendNeutral && 'bg-muted text-muted-foreground'
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {Math.abs(trend)}%
              {trendLabel && (
                <span className="ml-0.5 font-normal">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* Icon */}
        <div
          className={cn(
            'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl',
            iconBg
          )}
        >
          <Icon
            className={cn('h-5 w-5', iconColor)}
            strokeWidth={1.75}
          />
        </div>
      </div>
    </div>
  )
}