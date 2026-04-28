'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingPage } from '@/components/shared/LoadingSpinner'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import api from '@/lib/axios'
import type { LoanProduct, Lender, RepaymentFrequency } from '@/types'

// ── API helpers ───────────────────────────────────────────────────────────
const loanProductsApi = {
  getAll: () => api.get('/loan-products').then(r => r.data.data as LoanProduct[]),
}

const lendersApi = {
  getAll: () => api.get('/lenders').then(r => r.data.data as Lender[]),
}

const freqLabel: Record<RepaymentFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  bi_weekly: 'Bi-weekly',
  monthly: 'Monthly',
}

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
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-muted-foreground')} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export default function OfficerLoanProductsPage() {
  const [companyLenderId, setCompanyLenderId] = useState<string | null>(null)

  const { data: lenders = [], isLoading: lendersLoading } = useQuery({
    queryKey: ['lenders'],
    queryFn: lendersApi.getAll,
  })

  useEffect(() => {
    if (lenders.length > 0 && !companyLenderId) {
      setCompanyLenderId(lenders[0].lender_id)
    }
  }, [lenders, companyLenderId])

  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['loan-products'],
    queryFn: loanProductsApi.getAll,
    enabled: !!companyLenderId,
  })

  const products = allProducts.filter(p => p.lender_id === companyLenderId)

  const columns: ColumnDef<LoanProduct>[] = [
    {
      accessorKey: 'product_name',
      header: 'Product',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{row.original.product_name}</p>
          {row.original.description && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'min_amount',
      header: 'Loan Range',
      cell: ({ row }) => (
        <span className="text-sm font-mono text-foreground">
          {formatCurrency(row.original.min_amount)} – {formatCurrency(row.original.max_amount)}
        </span>
      ),
    },
    {
      accessorKey: 'interest_rate',
      header: 'Rate',
      cell: ({ row }) => <span className="text-sm font-mono">{row.original.interest_rate}%</span>,
    },
    {
      accessorKey: 'term_months',
      header: 'Term',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.term_months} mo · {freqLabel[row.original.repayment_frequency]}</span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => <ActiveBadge active={row.original.is_active} />,
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.created_at)}</span>,
    },
  ]

  if (lendersLoading || productsLoading) return <LoadingPage />

  return (
    <div>
      <PageHeader
        title="Loan Products"
        description={`Available loan products from ${lenders[0]?.name || 'your company'}`}
      />
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">All loan products</h3>
          <p className="text-xs text-muted-foreground">These products are used by borrowers when applying for loans.</p>
        </div>
        <div className="p-5">
          <DataTable
            columns={columns}
            data={products}
            searchPlaceholder="Search by product name…"
            emptyTitle="No loan products"
            emptyDescription="No products have been created for your company yet."
          />
        </div>
      </div>
    </div>
  )
}