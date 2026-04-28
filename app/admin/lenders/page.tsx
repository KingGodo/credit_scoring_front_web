'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2,
  Pencil,
  Loader2,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
} from 'lucide-react'
import Swal from 'sweetalert2'
import { cn, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingPage } from '@/components/shared/LoadingSpinner'
import api from '@/lib/axios'
import type { Lender } from '@/types'

// ── API helpers ───────────────────────────────────────────────────────────
const lendersApi = {
  getAll: () => api.get('/lenders').then(r => r.data.data as Lender[]),
  update: (id: string, payload: Partial<Lender>) =>
    api.put(`/lenders/${id}`, payload).then(r => r.data.data as Lender),
}

// ── Edit schema ───────────────────────────────────────────────────────────
const editSchema = z.object({
  name:                z.string().min(2, 'Company name is required'),
  registration_number: z.string().optional(),
  contact_email:       z.string().email('Invalid email address').optional(),
  contact_phone:       z.string().optional(),
  address:             z.string().optional(),
})

type EditFormData = z.infer<typeof editSchema>

// ── SweetAlert theme ─────────────────────────────────────────────────────
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

// ── Lender card component ────────────────────────────────────────────────
function LenderCard({ lender, onEdit }: { lender: Lender; onEdit: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{lender.name}</h3>
            {lender.registration_number && (
              <p className="text-xs text-muted-foreground">
                Reg: {lender.registration_number}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground hover:border-ring/50 hover:text-foreground transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {lender.contact_email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{lender.contact_email}</span>
          </div>
        )}
        {lender.contact_phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{lender.contact_phone}</span>
          </div>
        )}
        {lender.address && (
          <div className="flex items-start gap-2 text-sm sm:col-span-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-foreground">{lender.address}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Registered: {formatDate(lender.created_at)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────
export default function LendersPage() {
  const queryClient = useQueryClient()
  const [editLender, setEditLender] = useState<Lender | null>(null)
  const [editSheet, setEditSheet] = useState(false)

  // Fetch lenders
  const { data: lenders = [], isLoading } = useQuery({
    queryKey: ['lenders'],
    queryFn: lendersApi.getAll,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({ resolver: zodResolver(editSchema) })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: EditFormData) =>
      lendersApi.update(editLender!.lender_id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['lenders'] })
      setEditSheet(false)
      setEditLender(null)
      await Swal.fire({
        icon: 'success',
        title: 'Company updated!',
        timer: 1500,
        showConfirmButton: false,
        ...swalTheme(),
        customClass: swalCustomClass,
      })
    },
    onError: async (err: any) => {
      const msg = err.response?.data?.message || 'Update failed.'
      await Swal.fire({
        icon: 'error',
        title: 'Update failed',
        html: `<p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">${msg}</p>`,
        confirmButtonText: 'OK',
        ...swalTheme(),
        customClass: swalCustomClass,
      })
    },
  })

  const openEdit = (lender: Lender) => {
    setEditLender(lender)
    reset({
      name:                lender.name,
      registration_number: lender.registration_number || '',
      contact_email:       lender.contact_email || '',
      contact_phone:       lender.contact_phone || '',
      address:             lender.address || '',
    })
    setEditSheet(true)
  }

  if (isLoading) return <LoadingPage />

  return (
    <div>
      <PageHeader
        title="Company Details"
        description="View and manage your company (lender) information."
      />

      {lenders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-medium text-foreground">No company found</h3>
          <p className="text-xs text-muted-foreground">
            Your admin account is not associated with any lender.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {lenders.map((lender) => (
            <LenderCard key={lender.lender_id} lender={lender} onEdit={() => openEdit(lender)} />
          ))}
        </div>
      )}

      {/* Edit Sheet */}
      {editSheet && editLender && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => { setEditSheet(false); setEditLender(null) }}
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
                  Edit company details
                </h2>
                <p className="text-xs text-muted-foreground">
                  {editLender.name}
                </p>
              </div>
              <button
                onClick={() => { setEditSheet(false); setEditLender(null) }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <form id="edit-lender-form" onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Company name
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className={inputClass(!!errors.name)}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Registration number
                  </label>
                  <input
                    type="text"
                    {...register('registration_number')}
                    className={inputClass(!!errors.registration_number)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Contact email
                  </label>
                  <input
                    type="email"
                    {...register('contact_email')}
                    className={inputClass(!!errors.contact_email)}
                  />
                  {errors.contact_email && <p className="text-xs text-destructive">{errors.contact_email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Contact phone
                  </label>
                  <input
                    type="text"
                    {...register('contact_phone')}
                    className={inputClass(!!errors.contact_phone)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Address
                  </label>
                  <textarea
                    rows={2}
                    {...register('address')}
                    className={cn(inputClass(), 'h-auto resize-none py-2.5 leading-relaxed')}
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={() => { setEditSheet(false); setEditLender(null) }}
                className="flex h-10 flex-1 items-center justify-center rounded-lg border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-lender-form"
                disabled={updateMutation.isPending}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                ) : (
                  <><Save className="h-4 w-4" />Save changes</>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}