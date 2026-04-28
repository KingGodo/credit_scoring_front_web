'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  UserCheck,
  Mail,
  Building2,
  BadgeCheck,
  User,
  Lock,
  Briefcase,
} from 'lucide-react'
import Swal from 'sweetalert2'
import { authApi } from '@/lib/api/auth.api'
import { lendersApi } from '@/lib/api/lenders.api'
import { lenderStaffApi } from '@/lib/api/lender-staff.api'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingPage } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils'
import type { Lender } from '@/types'
import type { AxiosError } from 'axios'

// ── API error shape ───────────────────────────────────────────────────────
interface ApiErrorResponse {
  success: false
  message: string
}

// ── Validation schema ─────────────────────────────────────────────────────
const createSchema = z.object({
  full_name:  z.string().min(2, 'Full name is required'),
  email:      z.string().email('Enter a valid email address'),
  password:   z.string().min(6, 'Password must be at least 6 characters'),
  lender_id:  z.string().min(1, 'Please select a lender'),
  position:   z.string().min(2, 'Position is required'),
  role:       z.enum(['admin', 'loan_officer'] as const, {
    message: 'Please select a role',
  }),
})

type CreateFormData = z.infer<typeof createSchema>

// ── Role options ──────────────────────────────────────────────────────────
const roleOptions = [
  {
    value:       'loan_officer',
    label:       'Loan Officer',
    description: 'Process applications, verify KYC and record repayments',
    icon:        UserCheck,
    color:       'text-blue-600 dark:text-blue-400',
    bg:          'bg-blue-500/10',
  },
  {
    value:       'admin',
    label:       'Administrator',
    description: 'Full system access — manage all lenders, staff and products',
    icon:        BadgeCheck,
    color:       'text-purple-600 dark:text-purple-400',
    bg:          'bg-purple-500/10',
  },
]

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
export default function CreateStaffPage() {
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)

  // ── Lenders query ─────────────────────────────────────────────────────
  const { data: lenders = [], isLoading: lendersLoading } = useQuery({
    queryKey: ['lenders'],
    queryFn:  () => lendersApi.getAll(),
  })

  // ── Form ──────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver:      zodResolver(createSchema),
    defaultValues: { role: 'loan_officer' },
  })

  const selectedRole = watch('role')

  // ── Create mutation ───────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data: CreateFormData) => {
      // 1️⃣ Create the user account
      const newUser = await authApi.register({
        email:    data.email,
        password: data.password,
        role:     data.role,
      })

      // 2️⃣ Create the lender staff record
      return lenderStaffApi.create({
        user_id:   newUser.user_id,
        lender_id: data.lender_id,
        full_name: data.full_name,
        position:  data.position,
      })
    },
    onSuccess: async (_, variables) => {
      await Swal.fire({
        icon:              'success',
        title:             'Staff member created!',
        html:              `
          <p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">
            <strong>${variables.full_name}</strong> has been registered successfully
            and can now sign in with their credentials.
          </p>
        `,
        confirmButtonText: 'Go to staff list',
        ...swalTheme(),
        customClass: swalCustomClass,
      })

      router.push('/admin/lender-staff')
    },
    onError: async (err: unknown) => {
      const axiosErr = err as AxiosError<ApiErrorResponse>
      const message  =
        axiosErr.response?.data?.message ||
        'Failed to create staff member. Please try again.'

      await Swal.fire({
        icon:              'error',
        title:             'Creation failed',
        html:              `<p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">${message}</p>`,
        confirmButtonText: 'Try again',
        ...swalTheme(),
        customClass: swalCustomClass,
      })
    },
  })

  if (lendersLoading) return <LoadingPage />

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Add Staff Member"
        description="Register a new loan officer or administrator and assign them to a lender."
        action={
          <button
            onClick={() => router.push('/admin/lender-staff')}
            className={cn(
              'flex h-9 items-center gap-2 rounded-lg border border-input',
              'bg-background px-4 text-sm font-medium text-foreground',
              'hover:bg-muted transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to staff list
          </button>
        }
      />

      <form
        onSubmit={handleSubmit((data) => createMutation.mutate(data))}
        noValidate
        className="space-y-6"
      >
        {/* ── Section 1: Personal info ── */}
        <Section
          title="Personal information"
          description="The staff member's name as it will appear in the system."
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Full name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. Tendai Moyo"
                autoComplete="name"
                {...register('full_name')}
                className={cn(inputClass(!!errors.full_name), 'pl-9')}
              />
            </div>
            {errors.full_name && (
              <p className="text-xs text-destructive">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Job title / position
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. Loan Officer, Branch Manager"
                {...register('position')}
                className={cn(inputClass(!!errors.position), 'pl-9')}
              />
            </div>
            {errors.position && (
              <p className="text-xs text-destructive">
                {errors.position.message}
              </p>
            )}
          </div>
        </Section>

        {/* ── Section 2: Account credentials ── */}
        <Section
          title="Account credentials"
          description="Login email and a temporary password. The staff member will be prompted to change it on first login."
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                placeholder="officer@lender.co.zw"
                autoComplete="email"
                {...register('email')}
                className={cn(inputClass(!!errors.email), 'pl-9')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Temporary password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                {...register('password')}
                className={cn(inputClass(!!errors.password), 'pl-9 pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye    className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Share this password with the staff member. They will set a new one on first login.
            </p>
          </div>
        </Section>

        {/* ── Section 3: Lender assignment ── */}
        <Section
          title="Lender assignment"
          description="Select the microfinance institution this staff member will be working under."
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Assign to lender
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <select
                {...register('lender_id')}
                disabled={lendersLoading}
                className={cn(
                  inputClass(!!errors.lender_id),
                  'pl-9 cursor-pointer'
                )}
              >
                <option value="">
                  {lendersLoading ? 'Loading lenders…' : 'Select a lender'}
                </option>
                {lenders.map((l: Lender) => (
                  <option key={l.lender_id} value={l.lender_id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.lender_id && (
              <p className="text-xs text-destructive">
                {errors.lender_id.message}
              </p>
            )}
            {lenders.length === 0 && !lendersLoading && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No lenders found. Please create a lender first before adding staff.
              </p>
            )}
          </div>
        </Section>

        {/* ── Section 4: Role ── */}
        <Section
          title="System role"
          description="Controls what this staff member can see and do in the dashboard."
        >
          <div className="space-y-2">
            {roleOptions.map((opt) => {
              const Icon = opt.icon
              return (
                <label
                  key={opt.value}
                  className={cn(
                    'flex cursor-pointer items-start gap-4 rounded-xl border p-4',
                    'transition-colors',
                    selectedRole === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:bg-muted/50'
                  )}
                >
                  {/* Hidden radio */}
                  <input
                    type="radio"
                    value={opt.value}
                    {...register('role')}
                    className="sr-only"
                  />

                  {/* Icon */}
                  <div
                    className={cn(
                      'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
                      opt.bg
                    )}
                  >
                    <Icon
                      className={cn('h-4 w-4', opt.color)}
                      strokeWidth={1.75}
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          selectedRole === opt.value
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        {opt.label}
                      </p>

                      {/* Custom radio indicator */}
                      <div
                        className={cn(
                          'flex h-4 w-4 flex-shrink-0 items-center justify-center',
                          'rounded-full border-2 transition-colors',
                          selectedRole === opt.value
                            ? 'border-primary bg-primary'
                            : 'border-border bg-background'
                        )}
                      >
                        {selectedRole === opt.value && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {opt.description}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
          {errors.role && (
            <p className="text-xs text-destructive">{errors.role.message}</p>
          )}
        </Section>

        {/* ── Form actions ── */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <button
            type="button"
            onClick={() => router.push('/admin/lender-staff')}
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
            disabled={createMutation.isPending || lenders.length === 0}
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
                Creating staff member…
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                Create staff member
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}