'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Eye, Plus, Loader2, Mail, Phone, IdCard, Calendar } from 'lucide-react'
import Swal from 'sweetalert2'
import { formatDate, cn } from '@/lib/utils'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/tables/DataTable'
import { LoadingPage } from '@/components/shared/LoadingSpinner'
import api from '@/lib/axios'
import type { ColumnDef } from '@tanstack/react-table'

// ── Types ─────────────────────────────────────────────────────────────────
interface Borrower {
  borrower_id: string
  user_id: string
  phone: string
  national_id: string
  email?: string        // from API response
  is_active?: boolean   // from user association
  created_at: string
}

// ── API helpers ───────────────────────────────────────────────────────────
const borrowersApi = {
  getAll: () => api.get('/borrowers').then(r => r.data.data as Borrower[]),
  delete: (id: string) => api.delete(`/borrowers/${id}`),
}

// ── SweetAlert2 theme ─────────────────────────────────────────────────────
const isDark = () =>
  typeof window !== 'undefined' && document.documentElement.classList.contains('dark')

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

// ── Status badge ─────────────────────────────────────────────────────────
function StatusBadge({ isActive }: { isActive?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        isActive
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'bg-red-500/10 text-red-600 dark:text-red-400'
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isActive ? 'bg-emerald-500' : 'bg-red-500'
        )}
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

// ═════════════════════════════════════════════════════════════════════════
export default function BorrowersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  // ── Query borrowers ────────────────────────────────────────────────────
  const { data: borrowers = [], isLoading, error } = useQuery({
    queryKey: ['borrowers'],
    queryFn: borrowersApi.getAll,
  })

  // ── Delete mutation ───────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: borrowersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowers'] })
      Swal.fire({
        icon: 'success', title: 'Borrower deleted',
        timer: 1500, showConfirmButton: false,
        ...swalTheme(), customClass: swalCustomClass,
      })
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error', title: 'Delete failed',
        text: error.response?.data?.message || 'Please try again',
        ...swalTheme(), customClass: swalCustomClass,
      })
    },
  })

  const handleDelete = (borrower: Borrower) => {
    Swal.fire({
      icon: 'warning', title: 'Delete borrower?',
      html: `<p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">
        This will permanently delete the borrower account and all associated data.
      </p>`,
      showCancelButton: true, confirmButtonText: 'Yes, delete', cancelButtonText: 'Cancel',
      ...swalTheme(), customClass: swalCustomClass,
    }).then(result => {
      if (result.isConfirmed) deleteMutation.mutate(borrower.borrower_id)
    })
  }

  // ── Table columns ─────────────────────────────────────────────────────
  const columns: ColumnDef<Borrower>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-foreground">{row.original.email || '-'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-foreground">{row.original.phone}</span>
        </div>
      ),
    },
    {
      accessorKey: 'national_id',
      header: 'National ID',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IdCard className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-foreground">{row.original.national_id}</span>
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => <StatusBadge isActive={row.original.is_active} />,
    },
    {
      accessorKey: 'created_at',
      header: 'Registered',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.created_at)}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/officer/borrowers/${row.original.borrower_id}`)}
            title="View details"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background hover:border-ring/50 hover:text-foreground transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => router.push(`/officer/borrowers/${row.original.borrower_id}/edit`)}
            title="Edit"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background hover:border-ring/50 hover:text-foreground transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            title="Delete"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-800 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  if (isLoading) return <LoadingPage />
  if (error) return <div className="p-6 text-center text-destructive">Failed to load borrowers.</div>

  return (
    <div>
      <PageHeader
        title="Borrowers"
        description="Manage all registered borrowers (mobile app users)."
        action={
          <button
            onClick={() => router.push('/officer/borrowers/create')}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Register borrower
          </button>
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">All borrowers</h3>
          <p className="text-xs text-muted-foreground">
            {borrowers.length} total borrowers
          </p>
        </div>
        <div className="p-5">
          <DataTable
            columns={columns}
            data={borrowers}
            searchPlaceholder="Search by email, phone or national ID..."
            emptyTitle="No borrowers found"
            emptyDescription="Click 'Register borrower' to add your first borrower."
          />
        </div>
      </div>
    </div>
  )
}