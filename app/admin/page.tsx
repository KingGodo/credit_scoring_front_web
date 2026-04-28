'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Building2,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Brain,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingPage } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils'
import api from '@/lib/axios'
import type {
  Loan,
  LoanApplication,
  Borrower,
  Lender,
  PredictionRun,
  AuditLog,
  LenderStaff,
} from '@/types'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'

// ── Static chart data ─────────────────────────────────────────────────────
const loanVolumeData = [
  { month: 'Aug', loans: 12, amount: 28000 },
  { month: 'Sep', loans: 18, amount: 41000 },
  { month: 'Oct', loans: 15, amount: 35000 },
  { month: 'Nov', loans: 22, amount: 52000 },
  { month: 'Dec', loans: 19, amount: 44000 },
  { month: 'Jan', loans: 28, amount: 67000 },
  { month: 'Feb', loans: 31, amount: 74000 },
  { month: 'Mar', loans: 26, amount: 61000 },
]

const repaymentData = [
  { month: 'Oct', paid: 18, overdue: 3 },
  { month: 'Nov', paid: 24, overdue: 5 },
  { month: 'Dec', paid: 20, overdue: 4 },
  { month: 'Jan', paid: 30, overdue: 6 },
  { month: 'Feb', paid: 27, overdue: 3 },
  { month: 'Mar', paid: 22, overdue: 7 },
]

const riskData = [
  { name: 'Low Risk',       value: 42, color: '#22c55e' },
  { name: 'Medium Risk',    value: 31, color: '#eab308' },
  { name: 'High Risk',      value: 18, color: '#f97316' },
  { name: 'Very High Risk', value: 9,  color: '#ef4444' },
]

// ── Custom tooltips ───────────────────────────────────────────────────────
function AreaTooltip({
  active,
  payload,
  label,
}: {
  active?:  boolean
  payload?: { value: number; name: string }[]
  label?:   string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-card-md text-xs">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">
        Loans:{' '}
        <span className="font-medium text-foreground">{payload[0]?.value}</span>
      </p>
      <p className="text-muted-foreground">
        Amount:{' '}
        <span className="font-medium text-foreground">
          {formatCurrency(payload[1]?.value ?? 0)}
        </span>
      </p>
    </div>
  )
}

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?:  boolean
  payload?: { value: number; name: string }[]
  label?:   string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-card-md text-xs">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">
        Paid:{' '}
        <span className="font-medium text-emerald-600">{payload[0]?.value}</span>
      </p>
      <p className="text-muted-foreground">
        Overdue:{' '}
        <span className="font-medium text-red-500">{payload[1]?.value}</span>
      </p>
    </div>
  )
}

// ── Pie formatter — properly typed to satisfy Recharts ────────────────────
const pieFormatter = (
  value: ValueType,
  _name: NameType
): [string, NameType] => {
  const num = typeof value === 'number' ? value : 0
  return [`${num}%`, _name]
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  iconColor = 'text-brand-600 dark:text-brand-400',
  iconBg    = 'bg-brand-500/10',
}: {
  title:      string
  value:      string | number
  subtitle?:  string
  icon:       React.ElementType
  trend?:     number
  iconColor?: string
  iconBg?:    string
}) {
  const up   = trend !== undefined && trend > 0
  const down = trend !== undefined && trend < 0

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div
              className={cn(
                'mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                up   && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                down && 'bg-red-500/10 text-red-600 dark:text-red-400',
                !up && !down && 'bg-muted text-muted-foreground'
              )}
            >
              {up   && <TrendingUp   className="h-3 w-3" />}
              {down && <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}% this month
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl',
            iconBg
          )}
        >
          <Icon className={cn('h-5 w-5', iconColor)} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
export default function AdminDashboardPage() {

  const { data: loans = [],        isLoading: loansLoading }     =
    useQuery({ queryKey: ['loans'],        queryFn: () => api.get('/loans').then(r => r.data.data as Loan[]) })

  const { data: applications = [], isLoading: appsLoading }      =
    useQuery({ queryKey: ['applications'], queryFn: () => api.get('/loan-applications').then(r => r.data.data as LoanApplication[]) })

  const { data: borrowers = [],    isLoading: borrowersLoading } =
    useQuery({ queryKey: ['borrowers'],    queryFn: () => api.get('/borrowers').then(r => r.data.data as Borrower[]) })

  const { data: lenders = [],      isLoading: lendersLoading }   =
    useQuery({ queryKey: ['lenders'],      queryFn: () => api.get('/lenders').then(r => r.data.data as Lender[]) })

  const { data: staff = [] } =
    useQuery({ queryKey: ['lender-staff'], queryFn: () => api.get('/lender-staff').then(r => r.data.data as LenderStaff[]) })

  const { data: predictions = [] } =
    useQuery({ queryKey: ['predictions'],  queryFn: () => api.get('/prediction-runs').then(r => r.data.data as PredictionRun[]) })

  const { data: auditLogs = [] } =
    useQuery({ queryKey: ['audit-logs'],   queryFn: () => api.get('/audit-logs').then(r => r.data.data as AuditLog[]) })

  const isLoading = loansLoading || appsLoading || borrowersLoading || lendersLoading

  if (isLoading) return <LoadingPage />

  // ── Derived values ────────────────────────────────────────────────────
  const activeLoans    = loans.filter(l => l.loan_status === 'active')
  const defaultedLoans = loans.filter(l => l.loan_status === 'defaulted')
  const lateLoans      = loans.filter(l => l.loan_status === 'late')
  const pendingApps    = applications.filter(a => a.application_status === 'pending')
  const approvedApps   = applications.filter(a => a.application_status === 'approved')
  const totalDisbursed = loans.reduce((sum, l) => sum + Number(l.principal_amount), 0)
  const recentApps     = applications.slice(0, 5)
  const recentPreds    = predictions.slice(0, 5)
  const recentLogs     = auditLogs.slice(0, 6)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="System overview — loans, predictions, repayments and activity."
      />

      {/* ── Row 1: Stats ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Borrowers"
          value={borrowers.length}
          subtitle={`Across ${lenders.length} lenders · ${staff.length} staff`}
          icon={Users}
          trend={12}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-500/10"
        />
        <StatCard
          title="Active Loans"
          value={activeLoans.length}
          subtitle={`${lateLoans.length} late · ${defaultedLoans.length} defaulted`}
          icon={CreditCard}
          trend={8}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          title="Pending Applications"
          value={pendingApps.length}
          subtitle={`${approvedApps.length} approved total`}
          icon={Clock}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-500/10"
        />
        <StatCard
          title="Total Disbursed"
          value={formatCurrency(totalDisbursed)}
          subtitle="All time"
          icon={Banknote}
          trend={15}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-500/10"
        />
      </div>

      {/* ── Row 2: Charts ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Area chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Loan Volume</h3>
              <p className="text-xs text-muted-foreground">
                Monthly loans issued and total amount disbursed
              </p>
            </div>
            <Link
              href="/admin/loan-applications"
              className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={loanVolumeData}>
              <defs>
                <linearGradient id="gLoans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgb(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<AreaTooltip />} />
              <Area
                type="monotone"
                dataKey="loans"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#gLoans)"
                dot={false}
                activeDot={{ r: 4, fill: '#8b5cf6' }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#gAmount)"
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span className="text-xs text-muted-foreground">Loan count</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Amount disbursed</span>
            </div>
          </div>
        </div>

        {/* Donut chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Risk Distribution</h3>
            <p className="text-xs text-muted-foreground">ML credit scoring risk levels</p>
          </div>

          {predictions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Brain
                className="mb-2 h-8 w-8 text-muted-foreground/40"
                strokeWidth={1.5}
              />
              <p className="text-xs text-muted-foreground text-center">
                No predictions yet. Run ML scoring to see risk distribution.
              </p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {riskData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={pieFormatter}
                    contentStyle={{
                      fontSize:        '11px',
                      borderRadius:    '8px',
                      border:          '1px solid rgb(var(--border))',
                      backgroundColor: 'rgb(var(--card))',
                      color:           'rgb(var(--foreground))',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-2 space-y-1.5">
                {riskData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-xs font-medium font-mono text-foreground">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row 3: Repayments + Pending applications ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Bar chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Repayment Status</h3>
              <p className="text-xs text-muted-foreground">
                Monthly paid vs overdue installments
              </p>
            </div>
            <Link
              href="/admin/loans"
              className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              View loans <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={repaymentData} barSize={18} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgb(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="paid"    fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Paid</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">Overdue</span>
            </div>
          </div>
        </div>

        {/* Pending applications */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Pending Applications
              </h3>
              <p className="text-xs text-muted-foreground">
                Latest submitted loan applications
              </p>
            </div>
            <Link
              href="/admin/loan-applications"
              className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <CheckCircle
                  className="mb-2 h-8 w-8 text-emerald-500"
                  strokeWidth={1.5}
                />
                <p className="text-sm font-medium text-foreground">All clear!</p>
                <p className="text-xs text-muted-foreground">No pending applications</p>
              </div>
            ) : (
              recentApps.map((app) => (
                <div
                  key={app.application_id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {app.first_name && app.last_name
                        ? `${app.first_name} ${app.last_name}`
                        : app.borrower_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(app.requested_amount)} ·{' '}
                      {app.requested_term}mo · {app.product_name}
                    </p>
                  </div>
                  <StatusBadge status={app.application_status} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Row 4: Predictions + Audit log ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Recent predictions */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Recent Predictions
              </h3>
              <p className="text-xs text-muted-foreground">
                Latest ML credit scoring results
              </p>
            </div>
            <Link
              href="/admin/prediction-runs"
              className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentPreds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Brain
                  className="mb-2 h-8 w-8 text-muted-foreground/40"
                  strokeWidth={1.5}
                />
                <p className="text-sm font-medium text-foreground">No predictions yet</p>
                <p className="text-xs text-muted-foreground">
                  Predictions will appear after ML scoring runs
                </p>
              </div>
            ) : (
              recentPreds.map((p) => (
                <div
                  key={p.prediction_id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {p.first_name && p.last_name
                        ? `${p.first_name} ${p.last_name}`
                        : p.borrower_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Score:{' '}
                      <span className="font-mono font-medium text-foreground">
                        {p.credit_score}
                      </span>
                      {' · '}
                      {(p.default_probability * 100).toFixed(1)}% default prob.
                    </p>
                  </div>
                  <RiskBadge risk={p.risk_level} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit log */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
              <p className="text-xs text-muted-foreground">
                Latest system audit log entries
              </p>
            </div>
            <Link
              href="/admin/audit-logs"
              className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <AlertTriangle
                  className="mb-2 h-8 w-8 text-muted-foreground/40"
                  strokeWidth={1.5}
                />
                <p className="text-sm font-medium text-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground">System events will appear here</p>
              </div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.log_id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {log.user_email}
                        {' · '}
                        <span className="capitalize">{log.entity}</span>
                      </p>
                    </div>
                    <span className="flex-shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                      {formatRelativeTime(log.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Row 5: Quick links ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Manage Lenders',
            href:  '/admin/lenders',
            icon:  Building2,
            color: 'text-blue-600 dark:text-blue-400',
            bg:    'bg-blue-500/10',
          },
          {
            label: 'Manage Staff',
            href:  '/admin/lender-staff',
            icon:  Users,
            color: 'text-purple-600 dark:text-purple-400',
            bg:    'bg-purple-500/10',
          },
          {
            label: 'Loan Products',
            href:  '/admin/loan-products',
            icon:  CreditCard,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg:    'bg-emerald-500/10',
          },
          {
            label: 'ML Predictions',
            href:  '/admin/prediction-runs',
            icon:  Brain,
            color: 'text-amber-600 dark:text-amber-400',
            bg:    'bg-amber-500/10',
          },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-3 rounded-xl border border-border bg-card p-4',
              'shadow-card hover:shadow-card-md hover:border-ring/30',
              'transition-all group'
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
                link.bg
              )}
            >
              <link.icon
                className={cn('h-4 w-4', link.color)}
                strokeWidth={1.75}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {link.label}
              </p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}