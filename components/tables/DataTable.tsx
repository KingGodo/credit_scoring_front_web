'use client'

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { SearchInput } from '@/components/shared/SearchInput'

interface DataTableProps<TData> {
  columns:            ColumnDef<TData, any>[]
  data:               TData[]
  isLoading?:         boolean
  searchable?:        boolean
  searchPlaceholder?: string
  pageSize?:          number
  emptyTitle?:        string
  emptyDescription?:  string
  toolbar?:           React.ReactNode
}

export function DataTable<TData>({
  columns,
  data,
  isLoading          = false,
  searchable         = true,
  searchPlaceholder  = 'Search…',
  pageSize           = 10,
  emptyTitle         = 'No records found',
  emptyDescription   = 'Try adjusting your search or filters.',
  toolbar,
}: DataTableProps<TData>) {
  const [sorting,       setSorting]       = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter,  setGlobalFilter]  = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange:       setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange:  setGlobalFilter,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const totalFiltered = table.getFilteredRowModel().rows.length

  return (
    <div className="space-y-3">

      {/* Toolbar */}
      {(searchable || toolbar) && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            {searchable && (
              <SearchInput
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={setGlobalFilter}
                className="max-w-xs"
              />
            )}
            {toolbar}
          </div>
          <p className="text-xs text-muted-foreground flex-shrink-0">
            {totalFiltered} record{totalFiltered !== 1 && 's'}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            {/* Head */}
            <thead className="border-b border-border bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    const sorted  = header.column.getIsSorted()

                    return (
                      <th
                        key={header.id}
                        onClick={
                          canSort
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                        className={cn(
                          'px-4 py-3 text-left text-xs font-semibold',
                          'uppercase tracking-wide text-muted-foreground whitespace-nowrap',
                          canSort &&
                            'cursor-pointer select-none hover:text-foreground transition-colors'
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {canSort && (
                            <span className="text-muted-foreground/50">
                              {sorted === 'asc' ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : sorted === 'desc' ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronsUpDown className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-border bg-card">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-16 text-center"
                  >
                    <div className="flex justify-center">
                      <LoadingSpinner size="md" />
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                    />
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm text-foreground whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Page{' '}
            <span className="font-medium text-foreground">
              {table.getState().pagination.pageIndex + 1}
            </span>{' '}
            of{' '}
            <span className="font-medium text-foreground">
              {table.getPageCount()}
            </span>
          </p>

          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                'border border-input bg-background text-sm',
                'hover:bg-muted transition-colors',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page numbers */}
            {Array.from(
              { length: Math.min(table.getPageCount(), 5) },
              (_, i) => {
                const currentPage = table.getState().pagination.pageIndex
                const startPage   = Math.max(0, currentPage - 2)
                const page        = startPage + i

                if (page >= table.getPageCount()) return null

                const isActive = page === currentPage

                return (
                  <button
                    key={page}
                    onClick={() => table.setPageIndex(page)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      'text-sm border transition-colors',
                      isActive
                        ? 'border-foreground/20 bg-muted font-medium text-foreground'
                        : 'border-input bg-background text-foreground hover:bg-muted'
                    )}
                  >
                    {page + 1}
                  </button>
                )
              }
            )}

            {/* Next */}
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                'border border-input bg-background text-sm',
                'hover:bg-muted transition-colors',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}