'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye,
  EyeOff,
  Loader2,
  TrendingUp,
  ArrowLeft,
  User,
  Building2,
  BadgeCheck,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import Link from 'next/link'
import Swal from 'sweetalert2'
import { authApi } from '@/lib/api/auth.api'
import { lendersApi } from '@/lib/api/lenders.api'
import { lenderStaffApi } from '@/lib/api/lender-staff.api'
import { cn } from '@/lib/utils'
import type { AxiosError } from 'axios'

// ── Validation schema ─────────────────────────────────────────────────────
const registerSchema = z
  .object({
    // users table
    email:            z.string().email('Please enter a valid email address'),
    password:         z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),

    // lenders table
    lender_name:         z.string().min(2, 'Institution name is required'),
    registration_number: z.string().optional(),
    contact_email:       z
      .string()
      .email('Enter a valid institution email')
      .optional()
      .or(z.literal('')),
    contact_phone: z.string().optional(),
    address:       z.string().optional(),

    // lender_staff table
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    position:  z.string().min(2, 'Position is required'),
    role:      z.enum(['admin', 'loan_officer'] as const, {
      message: 'Please select a role',
    }),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path:    ['confirm_password'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

// ── API error type ────────────────────────────────────────────────────────
interface ApiErrorResponse {
  success: false
  message: string
  errors?: { msg: string; path: string }[]
}

// ── Steps config ──────────────────────────────────────────────────────────
const steps = [
  { id: 1, label: 'Personal',    icon: User      },
  { id: 2, label: 'Institution', icon: Building2 },
  { id: 3, label: 'Role',        icon: BadgeCheck },
]

// ── Role options ──────────────────────────────────────────────────────────
const roleOptions = [
  {
    value:       'admin',
    label:       'Administrator',
    description: 'Full access — manage lenders, staff, products and reports',
  },
  {
    value:       'loan_officer',
    label:       'Loan Officer',
    description: 'Process applications, verify KYC and record repayments',
  },
]

// ── SweetAlert2 theme helper ──────────────────────────────────────────────
const isDark = () =>
  typeof window !== 'undefined' &&
  document.documentElement.classList.contains('dark')

const swalTheme = () => ({
  background:         isDark() ? '#111827' : '#ffffff',
  color:              isDark() ? '#e2e8f0' : '#0f172a',
  confirmButtonColor: '#7c3aed',
  cancelButtonColor:  isDark() ? '#374151' : '#e2e8f0',
})

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

// ═════════════════════════════════════════════════════════════════════════
export default function RegisterPage() {
  const router = useRouter()

  const [currentStep,   setCurrentStep]   = useState(1)
  const [showPassword,  setShowPassword]  = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [isSubmitting,  setIsSubmitting]  = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver:      zodResolver(registerSchema),
    mode:          'onTouched',
    defaultValues: { role: 'admin' },
  })

  const selectedRole = watch('role')

  // ── Fields to validate per step before advancing ──────────────────────
  const stepFields: Record<number, (keyof RegisterFormData)[]> = {
    1: ['full_name', 'email', 'password', 'confirm_password'],
    2: ['lender_name'],
    3: ['position', 'role'],
  }

  const goNext = async () => {
    const valid = await trigger(stepFields[currentStep])
    if (valid) setCurrentStep((s) => s + 1)
  }

  const goBack = () => setCurrentStep((s) => s - 1)

  // ── Submit — posts to users → lenders → lender_staff ──────────────────
  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)
    try {
      // 1️⃣ Create user (public endpoint — no token needed)
      await authApi.register({
        email:    data.email,
        password: data.password,
        role:     data.role,
      })

      // 2️⃣ Login immediately to get a JWT for protected routes
      const loginResult = await authApi.login({
        email:    data.email,
        password: data.password,
      })

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', loginResult.token)
      }

      // 3️⃣ Create lender institution (protected)
      const newLender = await lendersApi.create({
        name:                data.lender_name,
        registration_number: data.registration_number || undefined,
        contact_email:       data.contact_email       || undefined,
        contact_phone:       data.contact_phone       || undefined,
        address:             data.address             || undefined,
      })

      // 4️⃣ Link user to lender as staff (protected)
      await lenderStaffApi.create({
        user_id:   loginResult.user.user_id,
        lender_id: newLender.lender_id,
        full_name: data.full_name,
        position:  data.position,
      })

      // 5️⃣ Clean up token — force proper login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }

      // ── Success alert ────────────────────────────────────────────────
      await Swal.fire({
        icon:              'success',
        title:             'Account created!',
        html:              `
          <p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">
            Account for <strong>${data.full_name}</strong> is ready.<br/>
            You can now sign in with your credentials.
          </p>
        `,
        confirmButtonText: 'Go to sign in',
        ...swalTheme(),
        customClass: {
          popup:         'rounded-2xl',
          title:         'text-base font-semibold',
          confirmButton: 'rounded-lg px-5 py-2 text-sm font-medium',
        },
      })

      router.replace('/login')

    } catch (err: unknown) {
      // Clean up token if something failed mid-way
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }

      const axiosErr = err as AxiosError<ApiErrorResponse>
      const message  =
        axiosErr.response?.data?.message ||
        'Registration failed. Please check your details and try again.'

      // ── Error alert ──────────────────────────────────────────────────
      await Swal.fire({
        icon:              'error',
        title:             'Registration failed',
        html:              `
          <p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">
            ${message}
          </p>
        `,
        confirmButtonText: 'Try again',
        ...swalTheme(),
        customClass: {
          popup:         'rounded-2xl',
          title:         'text-base font-semibold',
          confirmButton: 'rounded-lg px-5 py-2 text-sm font-medium',
        },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[540px]">

      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3 opacity-0 animate-fade-up [animation-fill-mode:forwards]">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card shadow-card">
          <TrendingUp className="h-7 w-7 text-foreground" strokeWidth={1.75} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            LoanApp
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register a lender admin account
          </p>
        </div>
      </div>

      {/* Card */}
      <div
        className={cn(
          'rounded-xl border border-border bg-card p-8 shadow-card-md',
          'opacity-0 animate-fade-up delay-100 [animation-fill-mode:forwards]'
        )}
      >

        {/* Step indicator */}
        <div className="mb-7 flex items-center">
          {steps.map((step, i) => {
            const done   = currentStep > step.id
            const active = currentStep === step.id
            const Icon   = step.icon

            return (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                      done   && 'border-primary bg-primary text-primary-foreground',
                      active && 'border-primary bg-background text-primary',
                      !done && !active &&
                        'border-border bg-background text-muted-foreground'
                    )}
                  >
                    {done
                      ? <BadgeCheck className="h-4 w-4" />
                      : <Icon       className="h-3.5 w-3.5" />}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      active ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      'mx-2 mb-4 h-0.5 flex-1 rounded-full transition-colors',
                      currentStep > step.id ? 'bg-primary' : 'bg-border'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* ── Step 1: Personal details ── */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Personal details
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your name and login credentials
                </p>
              </div>

              {/* Full name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tendai Moyo"
                  autoComplete="name"
                  {...register('full_name')}
                  className={inputClass(!!errors.full_name)}
                />
                {errors.full_name && (
                  <p className="text-xs text-destructive">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@institution.co.zw"
                  autoComplete="email"
                  {...register('email')}
                  className={inputClass(!!errors.email)}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password + Confirm side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      autoComplete="new-password"
                      {...register('password')}
                      className={cn(inputClass(!!errors.password), 'pr-10')}
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
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      {...register('confirm_password')}
                      className={cn(
                        inputClass(!!errors.confirm_password),
                        'pr-10'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPw
                        ? <EyeOff className="h-4 w-4" />
                        : <Eye    className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="text-xs text-destructive">
                      {errors.confirm_password.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Institution details ── */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Institution details
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your microfinance institution or lending company
                </p>
              </div>

              {/* Institution name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Institution name{' '}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zimbabwe Microfinance Trust"
                  {...register('lender_name')}
                  className={inputClass(!!errors.lender_name)}
                />
                {errors.lender_name && (
                  <p className="text-xs text-destructive">
                    {errors.lender_name.message}
                  </p>
                )}
              </div>

              {/* Registration number */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Registration number{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ZMF-2024-001"
                  {...register('registration_number')}
                  className={inputClass()}
                />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Institution email{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="email"
                    placeholder="info@institution.co.zw"
                    {...register('contact_email')}
                    className={inputClass(!!errors.contact_email)}
                  />
                  {errors.contact_email && (
                    <p className="text-xs text-destructive">
                      {errors.contact_email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Phone{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+263 77 123 4567"
                    {...register('contact_phone')}
                    className={inputClass()}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Address{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 123 Samora Machel Ave, Harare, Zimbabwe"
                  {...register('address')}
                  className={cn(
                    inputClass(),
                    'h-auto resize-none py-2.5 leading-relaxed'
                  )}
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Role ── */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Your role
                </h2>
                <p className="text-sm text-muted-foreground">
                  Select your position and job title within the institution
                </p>
              </div>

              {/* Role cards */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Account role
                </label>
                <div className="space-y-2">
                  {roleOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg border p-3.5',
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

                      {/* Custom radio dot */}
                      <div
                        className={cn(
                          'mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center',
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

                      {/* Text */}
                      <div className="min-w-0">
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
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {opt.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.role && (
                  <p className="text-xs text-destructive">
                    {errors.role.message}
                  </p>
                )}
              </div>

              {/* Position */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Job title / position
                </label>
                <input
                  type="text"
                  placeholder="e.g. Branch Manager, Loan Administrator"
                  {...register('position')}
                  className={inputClass(!!errors.position)}
                />
                {errors.position && (
                  <p className="text-xs text-destructive">
                    {errors.position.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div className="mt-6 flex gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={goBack}
                disabled={isSubmitting}
                className={cn(
                  'flex h-10 flex-1 items-center justify-center gap-2',
                  'rounded-lg border border-input bg-background',
                  'text-sm font-medium text-foreground',
                  'hover:bg-muted transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className={cn(
                  'flex h-10 flex-1 items-center justify-center gap-2',
                  'rounded-lg bg-primary text-sm font-medium text-primary-foreground',
                  'shadow-sm transition-opacity hover:opacity-90',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                )}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'flex h-10 flex-1 items-center justify-center gap-2',
                  'rounded-lg bg-primary text-sm font-medium text-primary-foreground',
                  'shadow-sm transition-opacity hover:opacity-90',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-60'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Back to login */}
      <div
        className={cn(
          'mt-5 flex justify-center',
          'opacity-0 animate-fade-up delay-200 [animation-fill-mode:forwards]'
        )}
      >
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  )
}