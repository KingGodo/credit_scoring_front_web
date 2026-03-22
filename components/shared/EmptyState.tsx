import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?:        LucideIcon
  title:        string
  description?: string
  action?:      React.ReactNode
  className?:   string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className
      )}
    >
      {/* Icon container */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
        <Icon
          className="h-6 w-6 text-muted-foreground"
          strokeWidth={1.5}
        />
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-foreground">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {/* Optional action button */}
      {action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  )
}