'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Package,
  Pencil,
  Trash2,
  Loader2,
  X,
  Building2,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
} from 'lucide-react'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingPage } from '@/components/shared/LoadingSpinner'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import api from '@/lib/axios'
import type { LoanProduct, Lender, RepaymentFrequency } from '@/types'
import type { AxiosError } from 'axios'

// ── API helpers ───────────────────────────────────────────────────────────
const loanProductsApi = {
  getAll:     () => api.get('/loan-products').then(r => r.data.data as LoanProduct[]),
  update:     (id: string, payload: Partial<LoanProduct>) =>
    api.put(`/loan-products/${id}`, payload).then(r => r.data.data as LoanProduct),
  activate:   (id: string) =>
    api.patch(`/loan-products/${id}/activate`).then(r => r.data.data as LoanProduct),
  deactivate: (id: string) =>
    api.patch(`/loan-products/${id}/deactivate`).then(r => r.data.data as LoanProduct),
  delete:     (id: string) => api.delete(`/loan-products/${id}`),
}

const lendersApi = {
  getAll: () => api.get('/lenders').then(r => r.data.data as Lender[]),
}

// ── API error shape ───────────────────────────────────────────────────────
interface ApiErrorResponse {
  success: false
  message: string
}

// ── Edit schema ───────────────────────────────────────────────────────────
const editSchema = z.object({
  product_name:        z.string().min(2, 'Product name is required'),
  description:         z.string().optional(),
  min_amount:          z.coerce.number().positive('Must be greater than 0'),
  max_amount:          z.coerce.number().positive('Must be greater than 0'),
  interest_rate:       z.coerce.number().min(0, 'Cannot be negative'),
  term_months:         z.coerce.number().int().positive('Must be a positive integer'),
  repayment_frequency: z.enum(
    ['daily', 'weekly', 'bi_weekly', 'monthly'] as const,
    { message: 'Select a repayment frequency' }
  ),
}).refine(d => d.min_amount < d.max_amount, {
  message: 'Minimum amount must be less than maximum amount',
  path:    ['min_amount'],
})

type EditFormData = z.infer<typeof editSchema>

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

// ── Frequency label ───────────────────────────────────────────────────────
const freqLabel: Record<RepaymentFrequency, string> = {
  daily:    'Daily',
  weekly:   'Weekly',
  bi_weekly:'Bi-weekly',
  monthly:  'Monthly',
}

// ── Active badge ──────────────────────────────────────────────────────────
function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        active
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground'
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          active ? 'bg-emerald-500' : 'bg-muted-foreground'
        )}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

// ═════════════════════════════════════════════════════════════════════════
export default function LoanProductsPage() {
  const router      = useRouter()
  const queryClient = useQueryClient()

  const [editSheet,  setEditSheet]  = useState(false)
  const [editTarget, setEditTarget] = useState<LoanProduct | null>(null)

  // ── Queries ───────────────────────────────────────────────────────────
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['loan-products'],
    queryFn:  loanProductsApi.getAll,
  })

  const { data: lenders = [] } = useQuery({
    queryKey: ['lenders'],
    queryFn:  lendersApi.getAll,
  })

  // ── Edit form ─────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({ resolver: zodResolver(editSchema) })

  // ── Edit mutation ─────────────────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: (data: EditFormData) =>
      loanProductsApi.update(editTarget!.product_id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['loan-products'] })
      setEditSheet(false)
      setEditTarget(null)
      await Swal.fire({
        icon: 'success', title: 'Product updated!',
        timer: 1500, showConfirmButton: false,
        ...swalTheme(), customClass: swalCustomClass,
      })
    },
    onError: async (err: unknown) => {
      const msg = (err as AxiosError<ApiErrorResponse>).response?.data?.message || 'Update failed.'
      await Swal.fire({
        icon: 'error', title: 'Update failed',
        html: `<p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">${msg}</p>`,
        confirmButtonText: 'OK', ...swalTheme(), customClass: swalCustomClass,
      })
    },
  })

  // ── Toggle active mutation ─────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: (product: LoanProduct) =>
      product.is_active
        ? loanProductsApi.deactivate(product.product_id)
        : loanProductsApi.activate(product.product_id),
    onSuccess: async (_, product) => {
      queryClient.invalidateQueries({ queryKey: ['loan-products'] })
      await Swal.fire({
        icon:  'success',
        title: product.is_active ? 'Product deactivated' : 'Product activated',
        timer: 1500, showConfirmButton: false,
        ...swalTheme(), customClass: swalCustomClass,
      })
    },
    onError: async () => {
      await Swal.fire({
        icon: 'error', title: 'Action failed',
        confirmButtonText: 'OK', ...swalTheme(), customClass: swalCustomClass,
      })
    },
  })

  // ── Delete handler ────────────────────────────────────────────────────
  const handleDelete = async (product: LoanProduct) => {
    const result = await Swal.fire({
      icon:              'warning',
      title:             'Delete loan product?',
      html:              `
        <p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">
          This will permanently delete <strong>${product.product_name}</strong>.
          Existing loans using this product will not be affected.
          This action cannot be undone.
        </p>
      `,
      showCancelButton:   true,
      confirmButtonText:  'Yes, delete',
      cancelButtonText:   'Cancel',
      confirmButtonColor: '#dc2626',
      ...swalTheme(), customClass: swalCustomClass,
    })
    if (!result.isConfirmed) return

    try {
      await loanProductsApi.delete(product.product_id)
      queryClient.invalidateQueries({ queryKey: ['loan-products'] })
      await Swal.fire({
        icon: 'success', title: 'Product deleted',
        timer: 1500, showConfirmButton: false,
        ...swalTheme(), customClass: swalCustomClass,
      })
    } catch (err: unknown) {
      const msg = (err as AxiosError<ApiErrorResponse>).response?.data?.message || 'Deletion failed.'
      await Swal.fire({
        icon: 'error', title: 'Deletion failed',
        html: `<p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">${msg}</p>`,
        confirmButtonText: 'OK', ...swalTheme(), customClass: swalCustomClass,
      })
    }
  }

  // ── Open edit ─────────────────────────────────────────────────────────
  const openEdit = (product: LoanProduct) => {
    setEditTarget(product)
    reset({
      product_name:        product.product_name,
      description:         product.description ?? '',
      min_amount:          product.min_amount,
      max_amount:          product.max_amount,
      interest_rate:       product.interest_rate,
      term_months:         product.term_months,
      repayment_frequency: product.repayment_frequency,
    })
    setEditSheet(true)
  }

  // ── Table columns ─────────────────────────────────────────────────────
  const columns: ColumnDef<LoanProduct>[] = [
    {
      accessorKey: 'product_name',
      header:      'Product',
      cell:        ({ row }) => (
        <div>
          <p className="font-medium text-foreground">
            {row.original.product_name}
          </p>
          {row.original.description && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'lender_name',
      header:      'Lender',
      cell:        ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-foreground">
            {row.original.lender_name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'min_amount',
      header:      'Loan Range',
      cell:        ({ row }) => (
        <span className="text-sm font-mono text-foreground">
          {formatCurrency(row.original.min_amount)} –{' '}
          {formatCurrency(row.original.max_amount)}
        </span>
      ),
    },
    {
      accessorKey: 'interest_rate',
      header:      'Rate',
      cell:        ({ row }) => (
        <span className="text-sm font-mono text-foreground">
          {row.original.interest_rate}%
        </span>
      ),
    },
    {
      accessorKey: 'term_months',
      header:      'Term',
      cell:        ({ row }) => (
        <span className="text-sm text-foreground">
          {row.original.term_months} mo ·{' '}
          <span className="text-muted-foreground">
            {freqLabel[row.original.repayment_frequency]}
          </span>
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header:      'Status',
      cell:        ({ row }) => (
        <ActiveBadge active={row.original.is_active} />
      ),
    },
    {
      accessorKey: 'created_at',
      header:      'Created',
      cell:        ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id:     'actions',
      header: 'Actions',
      cell:   ({ row }) => (
        <div className="flex items-center gap-2">
          {/* Toggle active */}
          <button
            onClick={() => toggleMutation.mutate(row.original)}
            disabled={toggleMutation.isPending}
            title={row.original.is_active ? 'Deactivate' : 'Activate'}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              'border border-input bg-background text-muted-foreground',
              'hover:border-ring/50 hover:text-foreground transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {row.original.is_active
              ? <ToggleRight className="h-4 w-4 text-emerald-500" />
              : <ToggleLeft  className="h-4 w-4" />}
          </button>

          {/* Edit */}
          <button
            onClick={() => openEdit(row.original)}
            title="Edit product"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              'border border-input bg-background text-muted-foreground',
              'hover:border-ring/50 hover:text-foreground transition-colors'
            )}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => handleDelete(row.original)}
            title="Delete product"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              'border border-input bg-background text-muted-foreground',
              'hover:border-red-300 hover:bg-red-50 hover:text-red-600',
              'dark:hover:border-red-800 dark:hover:bg-red-950 dark:hover:text-red-400',
              'transition-colors'
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  if (isLoading) return <LoadingPage />

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Loan Products"
        description="Manage all loan products offered by your lending institutions."
        action={
          <button
            onClick={() => router.push('/admin/loan-products/create')}
            className={cn(
              'flex h-9 items-center gap-2 rounded-lg bg-primary px-4',
              'text-sm font-medium text-primary-foreground',
              'shadow-sm transition-opacity hover:opacity-90',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
            )}
          >
            <Plus className="h-4 w-4" />
            Create product
          </button>
        }
      />

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Total Products',
            value: products.length,
            icon:  Package,
            color: 'text-blue-600 dark:text-blue-400',
            bg:    'bg-blue-500/10',
          },
          {
            label: 'Active',
            value: products.filter(p => p.is_active).length,
            icon:  ToggleRight,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg:    'bg-emerald-500/10',
          },
          {
            label: 'Inactive',
            value: products.filter(p => !p.is_active).length,
            icon:  ToggleLeft,
            color: 'text-muted-foreground',
            bg:    'bg-muted',
          },
          {
            label: 'Lenders',
            value: lenders.length,
            icon:  Building2,
            color: 'text-amber-600 dark:text-amber-400',
            bg:    'bg-amber-500/10',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1.5 text-2xl font-bold font-mono text-foreground">
                  {stat.value}
                </p>
              </div>
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', stat.bg)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} strokeWidth={1.75} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">
            All Loan Products
          </h3>
          <p className="text-xs text-muted-foreground">
            Click the toggle icon to activate or deactivate a product
          </p>
        </div>
        <div className="p-5">
          <DataTable
            columns={columns}
            data={products}
            searchPlaceholder="Search by product name or lender…"
            emptyTitle="No loan products yet"
            emptyDescription="Click 'Create product' to add your first loan product."
          />
        </div>
      </div>

      {/* ── Edit Sheet ── */}
      {editSheet && editTarget && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => { setEditSheet(false); setEditTarget(null) }}
          />

          <div className={cn(
            'fixed right-0 top-0 z-50 h-full w-full max-w-[480px]',
            'border-l border-border bg-card shadow-card-lg',
            'flex flex-col animate-slide-in-right'
          )}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Edit loan product
                </h2>
                <p className="text-xs text-muted-foreground">
                  {editTarget.product_name} · {editTarget.lender_name}
                </p>
              </div>
              <button
                onClick={() => { setEditSheet(false); setEditTarget(null) }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <form
                id="edit-product-form"
                onSubmit={handleSubmit((data) => editMutation.mutate(data))}
                className="space-y-4"
                noValidate
              >
                {/* Product name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Product name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SME Business Loan"
                    {...register('product_name')}
                    className={inputClass(!!errors.product_name)}
                  />
                  {errors.product_name && (
                    <p className="text-xs text-destructive">
                      {errors.product_name.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Description{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of this loan product"
                    {...register('description')}
                    className={cn(inputClass(), 'h-auto resize-none py-2.5 leading-relaxed')}
                  />
                </div>

                {/* Amount range */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Min amount (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 500"
                      {...register('min_amount')}
                      className={inputClass(!!errors.min_amount)}
                    />
                    {errors.min_amount && (
                      <p className="text-xs text-destructive">
                        {errors.min_amount.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Max amount (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 10000"
                      {...register('max_amount')}
                      className={inputClass(!!errors.max_amount)}
                    />
                    {errors.max_amount && (
                      <p className="text-xs text-destructive">
                        {errors.max_amount.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Interest rate + Term */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Interest rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 12.5"
                      {...register('interest_rate')}
                      className={inputClass(!!errors.interest_rate)}
                    />
                    {errors.interest_rate && (
                      <p className="text-xs text-destructive">
                        {errors.interest_rate.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Term (months)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 12"
                      {...register('term_months')}
                      className={inputClass(!!errors.term_months)}
                    />
                    {errors.term_months && (
                      <p className="text-xs text-destructive">
                        {errors.term_months.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Repayment frequency */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Repayment frequency
                  </label>
                  <select
                    {...register('repayment_frequency')}
                    className={cn(inputClass(!!errors.repayment_frequency), 'cursor-pointer')}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi_weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  {errors.repayment_frequency && (
                    <p className="text-xs text-destructive">
                      {errors.repayment_frequency.message}
                    </p>
                  )}
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={() => { setEditSheet(false); setEditTarget(null) }}
                className={cn(
                  'flex h-10 flex-1 items-center justify-center rounded-lg border',
                  'border-input bg-background text-sm font-medium text-foreground',
                  'hover:bg-muted transition-colors'
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-product-form"
                disabled={editMutation.isPending}
                className={cn(
                  'flex h-10 flex-1 items-center justify-center gap-2',
                  'rounded-lg bg-primary text-sm font-medium text-primary-foreground',
                  'shadow-sm transition-opacity hover:opacity-90',
                  'disabled:cursor-not-allowed disabled:opacity-60'
                )}
              >
                {editMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                ) : 'Save changes'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}