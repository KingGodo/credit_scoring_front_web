'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Package,
  DollarSign,
  Percent,
  Calendar,
  Loader2,
  AlignLeft,
} from 'lucide-react'
import Swal from 'sweetalert2'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingPage } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import type { Lender, LoanProduct } from '@/types'
import type { AxiosError } from 'axios'

// ── API helpers ───────────────────────────────────────────────────────────
const lendersApi = {
  getAll: () => api.get('/lenders').then(r => r.data.data as Lender[]),
}

const loanProductsApi = {
  create: (payload: object) =>
    api.post('/loan-products', payload).then(r => r.data.data as LoanProduct),
}

// ── API error shape ───────────────────────────────────────────────────────
interface ApiErrorResponse {
  success: false
  message: string
}

// ── Validation schema (without lender_id) ─────────────────────────────────
const createSchema = z.object({
  product_name:        z.string().min(2, 'Product name is required'),
  description:         z.string().optional(),
  min_amount:          z.coerce.number().positive('Must be greater than 0'),
  max_amount:          z.coerce.number().positive('Must be greater than 0'),
  interest_rate:       z.coerce.number().min(0, 'Cannot be negative'),
  term_months:         z.coerce.number().int().positive('Must be a positive integer'),
}).refine(d => d.min_amount < d.max_amount, {
  message: 'Minimum amount must be less than maximum amount',
  path:    ['min_amount'],
})

type CreateFormData = z.infer<typeof createSchema>

// ── SweetAlert2 theme ─────────────────────────────────────────────────────
const isDark = () =>
  typeof window !== 'undefined' &&
  document.documentElement.classList.contains('dark')

const swalTheme = () => ({
  background:         isDark() ? '#111827' : '#ffffff',
  color:              isDark() ? '#e2e8f0' : '#0f172a',
  confirmButtonColor: '#7c3aed',
  cancelButtonColor:  isDark() ? '#374151' : '#e5e7eb',
})

const swalCustomClass = {
  popup:         'rounded-2xl',
  title:         'text-base font-semibold',
  confirmButton: 'rounded-lg px-5 py-2 text-sm font-medium',
  cancelButton:  'rounded-lg px-5 py-2 text-sm font-medium',
}

// ── Input class ───────────────────────────────────────────────────────────
const inputClass = (hasError?: boolean) =>
  cn(
    'flex h-10 w-full rounded-lg border bg-background px-3 py-2',
    'text-sm text-foreground placeholder:text-muted-foreground',
    'transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
    'disabled:cursor-not-allowed disabled:opacity-50',
    hasError
      ? 'border-destructive focus:ring-destructive/30'
      : 'border-input hover:border-ring/50'
  )

// ── Section wrapper ───────────────────────────────────────────────────────
function Section({
  title,
  description,
  children,
}: {
  title:       string
  description: string
  children:    React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="md:col-span-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
export default function CreateLoanProductPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)

  const [lenderId, setLenderId] = useState<string | null>(null)
  const [lenderName, setLenderName] = useState<string>('')

  // ── Fetch all lenders and take the first (admin's company) ──
  const { data: lenders = [], isLoading: lendersLoading, error: lendersError } = useQuery({
    queryKey: ['lenders'],
    queryFn: lendersApi.getAll,
    enabled: !!token,
  })

  useEffect(() => {
    if (lenders.length > 0) {
      setLenderId(lenders[0].lender_id)
      setLenderName(lenders[0].name)
    } else if (!lendersLoading && lenders.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'No company found',
        text: 'Your admin account is not associated with any lender.',
        confirmButtonText: 'OK',
        ...swalTheme(),
        customClass: swalCustomClass,
      }).then(() => router.push('/admin'))
    }
  }, [lenders, lendersLoading, router])

  if (lendersError) {
    return <div className="p-6 text-center text-destructive">Failed to load company information.</div>
  }

  // ── Form ──────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
  })

  // ── Create mutation ───────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: CreateFormData) => {
      if (!lenderId) throw new Error('No lender associated')
      return loanProductsApi.create({
        ...data,
        lender_id: lenderId,
        repayment_frequency: 'monthly',   // fixed
      })
    },
    onSuccess: async (_, variables) => {
      await Swal.fire({
        icon:              'success',
        title:             'Loan product created!',
        html:              `
          <p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">
            <strong>${variables.product_name}</strong> has been created
            and is now available for loan applications.
          </p>
        `,
        confirmButtonText: 'Go to products',
        ...swalTheme(),
        customClass: swalCustomClass,
      })
      router.push('/admin/loan-products')
    },
    onError: async (err: unknown) => {
      const msg =
        (err as AxiosError<ApiErrorResponse>).response?.data?.message ||
        'Failed to create loan product. Please try again.'

      await Swal.fire({
        icon:              'error',
        title:             'Creation failed',
        html:              `<p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">${msg}</p>`,
        confirmButtonText: 'Try again',
        ...swalTheme(),
        customClass: swalCustomClass,
      })
    },
  })

  if (lendersLoading) return <LoadingPage />
  if (!lenderId) return null

  return (
    <div>
      <PageHeader
        title="Create Loan Product"
        description={`Define a new loan product for ${lenderName}.`}
        action={
          <button
            onClick={() => router.push('/dashboard/admin/loan-products')}
            className={cn(
              'flex h-9 items-center gap-2 rounded-lg border border-input',
              'bg-background px-4 text-sm font-medium text-foreground',
              'hover:bg-muted transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to products
          </button>
        }
      />

      <form
        onSubmit={handleSubmit((data) => createMutation.mutate(data))}
        noValidate
        className="space-y-6"
      >
        {/* ── Section 1: Product details ── */}
        <Section
          title="Product details"
          description="Name and description of the loan product as borrowers will see it."
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Product name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. SME Business Loan"
                {...register('product_name')}
                className={cn(inputClass(!!errors.product_name), 'pl-9')}
              />
            </div>
            {errors.product_name && (
              <p className="text-xs text-destructive">
                {errors.product_name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Description{' '}
              <span className="text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <textarea
                rows={3}
                placeholder="Brief description of this loan product for borrowers…"
                {...register('description')}
                className={cn(
                  inputClass(),
                  'h-auto resize-none py-2.5 pl-9 leading-relaxed'
                )}
              />
            </div>
          </div>
        </Section>

        {/* ── Section 2: Loan amounts ── */}
        <Section
          title="Loan amounts"
          description="Set the minimum and maximum loan amounts available under this product."
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Minimum amount (USD) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="500"
                  {...register('min_amount')}
                  className={cn(inputClass(!!errors.min_amount), 'pl-9')}
                />
              </div>
              {errors.min_amount && (
                <p className="text-xs text-destructive">
                  {errors.min_amount.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Maximum amount (USD) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="10000"
                  {...register('max_amount')}
                  className={cn(inputClass(!!errors.max_amount), 'pl-9')}
                />
              </div>
              {errors.max_amount && (
                <p className="text-xs text-destructive">
                  {errors.max_amount.message}
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* ── Section 3: Interest & Term ── */}
        <Section
          title="Interest & term"
          description="Set the annual interest rate and maximum loan duration in months."
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Interest rate (%) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="12.5"
                  {...register('interest_rate')}
                  className={cn(inputClass(!!errors.interest_rate), 'pl-9')}
                />
              </div>
              {errors.interest_rate && (
                <p className="text-xs text-destructive">
                  {errors.interest_rate.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Term (months) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="number"
                  min="1"
                  placeholder="12"
                  {...register('term_months')}
                  className={cn(inputClass(!!errors.term_months), 'pl-9')}
                />
              </div>
              {errors.term_months && (
                <p className="text-xs text-destructive">
                  {errors.term_months.message}
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* ── Section 4: Repayment (fixed monthly) ── */}
        <Section
          title="Repayment frequency"
          description="Repayments will be collected monthly."
        >
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground">Monthly</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Repayment collected once per month. This is the only option available.
            </p>
          </div>
        </Section>

        {/* ── Form actions ── */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard/admin/loan-products')}
            disabled={createMutation.isPending}
            className={cn(
              'flex h-10 items-center gap-2 rounded-lg border border-input',
              'bg-background px-5 text-sm font-medium text-foreground',
              'hover:bg-muted transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || !lenderId}
            className={cn(
              'flex h-10 items-center gap-2 rounded-lg bg-primary px-5',
              'text-sm font-medium text-primary-foreground',
              'shadow-sm transition-opacity hover:opacity-90',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating product…
              </>
            ) : (
              <>
                <Package className="h-4 w-4" />
                Create loan product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}