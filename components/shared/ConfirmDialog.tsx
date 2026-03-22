'use client'

import { Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open:          boolean
  onClose:       () => void
  onConfirm:     () => void
  title:         string
  description:   string
  confirmLabel?: string
  variant?:      'danger' | 'warning' | 'default'
  isLoading?:    boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  variant      = 'danger',
  isLoading    = false,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'w-full max-w-sm rounded-2xl bg-card p-6',
            'border border-border shadow-card-lg',
            'animate-fade-up'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div
            className={cn(
              'mb-4 flex h-12 w-12 items-center justify-center rounded-full',
              variant === 'danger'  && 'bg-red-500/10',
              variant === 'warning' && 'bg-orange-500/10',
              variant === 'default' && 'bg-muted'
            )}
          >
            <AlertTriangle
              className={cn(
                'h-6 w-6',
                variant === 'danger'  && 'text-red-500',
                variant === 'warning' && 'text-orange-500',
                variant === 'default' && 'text-foreground'
              )}
              strokeWidth={1.75}
            />
          </div>

          {/* Text */}
          <h3 className="text-base font-semibold text-foreground">
            {title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {description}
          </p>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={cn(
                'flex h-9 flex-1 items-center justify-center rounded-lg border',
                'border-input bg-background text-sm font-medium text-foreground',
                'hover:bg-muted transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                'flex h-9 flex-1 items-center justify-center gap-2',
                'rounded-lg text-sm font-medium text-white',
                'transition-colors',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                variant === 'danger'  && 'bg-red-600 hover:bg-red-700',
                variant === 'warning' && 'bg-orange-500 hover:bg-orange-600',
                variant === 'default' && 'bg-primary text-primary-foreground hover:opacity-90'
              )}
            >
              {isLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}