import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?:      'sm' | 'md' | 'lg'
  className?: string
  fullPage?:  boolean
}

export function LoadingSpinner({
  size = 'md',
  className,
  fullPage,
}: LoadingSpinnerProps) {
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }[size]

  if (fullPage) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2
          className={cn(
            'animate-spin text-foreground',
            sizeClass,
            className
          )}
        />
      </div>
    )
  }

  return (
    <Loader2
      className={cn(
        'animate-spin text-muted-foreground',
        sizeClass,
        className
      )}
    />
  )
}

export function LoadingPage() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  )
}