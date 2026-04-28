'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  UserCheck,
  Loader2,
  X,
  Pencil,
  Trash2,
  Building2,
  BadgeCheck,
} from 'lucide-react'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import { lendersApi } from '@/lib/api/lenders.api'
import { lenderStaffApi } from '@/lib/api/lender-staff.api'
import { DataTable } from '@/components/tables/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingPage } from '@/components/shared/LoadingSpinner'
import { formatDate, cn } from '@/lib/utils'
import type { LenderStaff, Lender } from '@/types'
import type { AxiosError } from 'axios'

// ── API error shape ───────────────────────────────────────────────────────
interface ApiErrorResponse {
  success: false
  message: string
}

// ── Edit schema ───────────────────────────────────────────────────────────
const editSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  position:  z.string().min(2, 'Position is required'),
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

// ── Input class helper ────────────────────────────────────────────────────
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

// ── Role badge ────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        role === 'admin'
          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      )}
    >
      <BadgeCheck className="h-3 w-3" />
      {role === 'admin' ? 'Administrator' : 'Loan Officer'}
    </span>
  )
}

// ═════════════════════════════════════════════════════════════════════════
export default function LenderStaffPage() {
  const router      = useRouter()
  const queryClient = useQueryClient()

  const [editSheet,  setEditSheet]  = useState(false)
  const [editTarget, setEditTarget] = useState<LenderStaff | null>(null)

  // ── Queries ───────────────────────────────────────────────────────────
  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['lender-staff'],
    queryFn:  () => lenderStaffApi.getAll(),
  })

  const { data: lenders = [] } = useQuery({
    queryKey: ['lenders'],
    queryFn:  () => lendersApi.getAll(),
  })

  // ── Edit form ─────────────────────────────────────────────────────────
  const {
    register:     editRegister,
    handleSubmit: handleEditSubmit,
    reset:        resetEdit,
    formState:    { errors: editErrors },
  } = useForm<EditFormData>({ resolver: zodResolver(editSchema) })

  // ── Edit mutation ─────────────────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: (data: EditFormData) =>
      lenderStaffApi.update(editTarget!.staff_id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['lender-staff'] })
      setEditSheet(false)
      setEditTarget(null)
      resetEdit()

      await Swal.fire({
        icon:              'success',
        title:             'Staff member updated!',
        timer:             1500,
        showConfirmButton: false,
        ...swalTheme(),
        customClass: swalCustomClass,
      })
    },
    onError: async (err: unknown) => {
      const axiosErr = err as AxiosError<ApiErrorResponse>
      const message  =
        axiosErr.response?.data?.message || 'Failed to update staff member.'

      await Swal.fire({
        icon:              'error',
        title:             'Update failed',
        html:              `<p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">${message}</p>`,
        confirmButtonText: 'OK',
        ...swalTheme(),
        customClass: swalCustomClass,
      })
    },
  })

  // ── Delete handler ────────────────────────────────────────────────────
  const handleDelete = async (member: LenderStaff) => {
    const result = await Swal.fire({
      icon:               'warning',
      title:              'Remove staff member?',
      html:               `
        <p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">
          This will remove <strong>${member.full_name}</strong> from the system.
          They will lose access immediately. This action cannot be undone.
        </p>
      `,
      showCancelButton:   true,
      confirmButtonText:  'Yes, remove',
      cancelButtonText:   'Cancel',
      confirmButtonColor: '#dc2626',
      ...swalTheme(),
      customClass: swalCustomClass,
    })

    if (!result.isConfirmed) return

    try {
      await lenderStaffApi.delete(member.staff_id)
      queryClient.invalidateQueries({ queryKey: ['lender-staff'] })

      await Swal.fire({
        icon:              'success',
        title:             'Staff member removed',
        timer:             1500,
        showConfirmButton: false,
        ...swalTheme(),
        customClass: swalCustomClass,
      })
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiErrorResponse>
      const message  =
        axiosErr.response?.data?.message || 'Failed to remove staff member.'

      await Swal.fire({
        icon:              'error',
        title:             'Deletion failed',
        html:              `<p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">${message}</p>`,
        confirmButtonText: 'OK',
        ...swalTheme(),
        customClass: swalCustomClass,
      })
    }
  }

  // ── Open edit sheet ───────────────────────────────────────────────────
  const openEdit = (member: LenderStaff) => {
    setEditTarget(member)
    resetEdit({ full_name: member.full_name, position: member.position })
    setEditSheet(true)
  }

  // ── Table columns ─────────────────────────────────────────────────────
  const columns: ColumnDef<LenderStaff>[] = [
    {
      accessorKey: 'full_name',
      header:      'Name',
      cell:        ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-semibold text-brand-600 dark:text-brand-400">
            {row.original.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {row.original.full_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header:      'Role',
      cell:        ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      accessorKey: 'position',
      header:      'Position',
      cell:        ({ row }) => (
        <span className="text-sm text-foreground">
          {row.original.position}
        </span>
      ),
    },
    {
      accessorKey: 'lender_name',
      header:      'Assigned Lender',
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
          <button
            onClick={() => openEdit(row.original)}
            title="Edit staff member"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              'border border-input bg-background text-muted-foreground',
              'hover:border-ring/50 hover:text-foreground transition-colors'
            )}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            title="Remove staff member"
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

  if (staffLoading) return <LoadingPage />

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Lender Staff"
        description="Manage loan officers and administrators across all lenders."
        action={
          <button
            onClick={() => router.push('/admin/lender-staff/create')}
            className={cn(
              'flex h-9 items-center gap-2 rounded-lg bg-primary px-4',
              'text-sm font-medium text-primary-foreground',
              'shadow-sm transition-opacity hover:opacity-90',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
            )}
          >
            <Plus className="h-4 w-4" />
            Add staff member
          </button>
        }
      />

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Total Staff',
            value: staff.length,
            icon:  UserCheck,
            color: 'text-blue-600 dark:text-blue-400',
            bg:    'bg-blue-500/10',
          },
          {
            label: 'Administrators',
            value: staff.filter((s) => s.role === 'admin').length,
            icon:  BadgeCheck,
            color: 'text-purple-600 dark:text-purple-400',
            bg:    'bg-purple-500/10',
          },
          {
            label: 'Loan Officers',
            value: staff.filter((s) => s.role === 'loan_officer').length,
            icon:  UserCheck,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg:    'bg-emerald-500/10',
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
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  stat.bg
                )}
              >
                <stat.icon
                  className={cn('h-5 w-5', stat.color)}
                  strokeWidth={1.75}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">All Staff</h3>
          <p className="text-xs text-muted-foreground">
            All loan officers and administrators registered in the system
          </p>
        </div>
        <div className="p-5">
          <DataTable
            columns={columns}
            data={staff}
            searchPlaceholder="Search by name, email or lender…"
            emptyTitle="No staff members yet"
            emptyDescription="Click 'Add staff member' to register a loan officer."
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

          <div
            className={cn(
              'fixed right-0 top-0 z-50 h-full w-full max-w-[440px]',
              'border-l border-border bg-card shadow-card-lg',
              'flex flex-col animate-slide-in-right'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Edit staff member
                </h2>
                <p className="text-xs text-muted-foreground">
                  Update name and position for {editTarget.full_name}
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
              {/* Current info */}
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-sm font-semibold text-brand-600 dark:text-brand-400">
                  {editTarget.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {editTarget.email}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <RoleBadge role={editTarget.role} />
                    <span className="text-xs text-muted-foreground">
                      · {editTarget.lender_name}
                    </span>
                  </div>
                </div>
              </div>

              <form
                id="edit-staff-form"
                onSubmit={handleEditSubmit((data) =>
                  editMutation.mutate(data)
                )}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Full name
                  </label>
                  <input
                    type="text"
                    placeholder="Full name"
                    {...editRegister('full_name')}
                    className={inputClass(!!editErrors.full_name)}
                  />
                  {editErrors.full_name && (
                    <p className="text-xs text-destructive">
                      {editErrors.full_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Position / job title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Loan Officer, Branch Manager"
                    {...editRegister('position')}
                    className={inputClass(!!editErrors.position)}
                  />
                  {editErrors.position && (
                    <p className="text-xs text-destructive">
                      {editErrors.position.message}
                    </p>
                  )}
                </div>

                <p className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                  Email address and assigned lender cannot be changed here.
                  To reassign a lender, delete and recreate the staff member.
                </p>
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
                form="edit-staff-form"
                disabled={editMutation.isPending}
                className={cn(
                  'flex h-10 flex-1 items-center justify-center gap-2',
                  'rounded-lg bg-primary text-sm font-medium text-primary-foreground',
                  'shadow-sm transition-opacity hover:opacity-90',
                  'disabled:cursor-not-allowed disabled:opacity-60'
                )}
              >
                {editMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}