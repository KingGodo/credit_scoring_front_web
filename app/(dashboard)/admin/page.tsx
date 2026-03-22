'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Building2,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Banknote,
} from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingPage } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RiskBadge } from '@/components/shared/RiskBadge'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import api from '@/lib/axios'
import type {
  Loan,
  LoanApplication,
  Borrower,
  Lender,
  PredictionRun,
  AuditLog,
} from '@/types'
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
} from 'recharts'

// ── Mock chart data (replace with real API when available) ────────────────
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

const riskData = [
  { name: 'Low Risk',       value: 42, color: '#d4d4d8' },
  { name: 'Medium Risk',    value: 31, color: '#a1a1aa' },
  { name: 'High Risk',      value: 18, color: '#71717a' },
  { name: 'Very High Risk', value: 9,  color: '#18181b' },
]

// ── Custom tooltip for area chart ─────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-card-md text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">
        Loans:{' '}
        <span className="font-medium text-foreground">
          {payload[0]?.value}
        </span>
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

// ═════════════════════════════════════════════════════════════════════════
export default function AdminDashboardPage() {

  // ── Data fetching ───────────────────────────────────────────────────
  const { data: loans = [],        isLoading: loansLoading }   =
    useQuery({ queryKey: ['loans'],        queryFn: () => api.get('/loans').then(r => r.data.data as Loan[]) })

  const { data: applications = [], isLoading: appsLoading }    =
    useQuery({ queryKey: ['applications'], queryFn: () => api.get('/loan-applications').then(r => r.data.data as LoanApplication[]) })

  const { data: borrowers = [],    isLoading: borrowersLoading } =
    useQuery({ queryKey: ['borrowers'],    queryFn: () => api.get('/borrowers').then(r => r.data.data as Borrower[]) })

  const { data: lenders = [],      isLoading: lendersLoading }  =
    useQuery({ queryKey: ['lenders'],      queryFn: () => api.get('/lenders').then(r => r.data.data as Lender[]) })

  const { data: predictions = [] } =
    useQuery({ queryKey: ['predictions'],  queryFn: () => api.get('/prediction-runs').then(r => r.data.data as PredictionRun[]) })

  const { data: auditLogs = [] } =
    useQuery({ queryKey: ['audit-logs'],   queryFn: () => api.get('/audit-logs').then(r => r.data.data as AuditLog[]) })

  const isLoading =
    loansLoading || appsLoading || borrowersLoading || lendersLoading

  if (isLoading) return <LoadingPage />

  // ── Derived stats ───────────────────────────────────────────────────
  const activeLoans      = loans.filter(l => l.loan_status === 'active').length
  const defaultedLoans   = loans.filter(l => l.loan_status === 'defaulted').length
  const pendingApps      = applications.filter(a => a.application_status === 'pending').length
  const approvedApps     = applications.filter(a => a.application_status === 'approved').length
  const totalDisbursed   = loans.reduce((sum, l) => sum + Number(l.principal_amount), 0)
  const recentLogs       = auditLogs.slice(0, 6)
  const recentPredictions = predictions.slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your loan portfolio and system activity."
      />

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Borrowers"
          value={borrowers.length}
          subtitle={`Across ${lenders.length} lenders`}
          icon={Users}
          trend={12}
          trendLabel="this month"
        />
        <StatsCard
          title="Active Loans"
          value={activeLoans}
          subtitle={`${defaultedLoans} defaulted`}
          icon={CreditCard}
          trend={8}
          trendLabel="this month"
        />
        <StatsCard
          title="Pending Applications"
          value={pendingApps}
          subtitle={`${approvedApps} approved total`}
          icon={Clock}
        />
        <StatsCard
          title="Total Disbursed"
          value={formatCurrency(totalDisbursed)}
          subtitle="All time"
          icon={Banknote}
          trend={15}
          trendLabel="this month"
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Loan volume area chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Loan Volume
            </h3>
            <p className="text-xs text-muted-foreground">
              Monthly loans issued and amount disbursed
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={loanVolumeData}>
              <defs>
                <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
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
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="loans"
                stroke="#18181b"
                strokeWidth={2}
                fill="url(#colorLoans)"
                dot={false}
                activeDot={{ r: 4, fill: '#18181b' }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#71717a"
                strokeWidth={2}
                fill="url(#colorAmount)"
                dot={false}
                activeDot={{ r: 4, fill: '#71717a' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk distribution donut */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Risk Distribution
            </h3>
            <p className="text-xs text-muted-foreground">
              ML prediction risk levels
            </p>
          </div>
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
                formatter={(value) => [`${Number(value ?? 0)}%`, '']}
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
          {/* Legend */}
          <div className="mt-2 space-y-1.5">
            {riskData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.name}
                  </span>
                </div>
                <span className="text-xs font-medium text-foreground font-mono">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Recent predictions */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">
              Recent Predictions
            </h3>
            <p className="text-xs text-muted-foreground">
              Latest ML credit scoring results
            </p>
          </div>
          <div className="divide-y divide-border">
            {recentPredictions.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No predictions yet
              </p>
            ) : (
              recentPredictions.map((p) => (
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
                      {' '}· {(p.default_probability * 100).toFixed(1)}% default prob.
                    </p>
                  </div>
                  <RiskBadge risk={p.risk_level} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">
              Recent Activity
            </h3>
            <p className="text-xs text-muted-foreground">
              Latest system audit log entries
            </p>
          </div>
          <div className="divide-y divide-border">
            {recentLogs.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No activity yet
              </p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.log_id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {log.user_email} · {log.entity}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(log.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}