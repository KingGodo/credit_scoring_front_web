'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Eye,
  EyeOff,
  Loader2,
  TrendingUp,
  UserPlus,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { authApi } from '@/lib/api/auth.api'
import { lendersApi } from '@/lib/api/lenders.api'
import { lenderStaffApi } from '@/lib/api/lender-staff.api'
import { cn } from '@/lib/utils'
import type { Lender } from '@/types'

// ── Validation schema ─────────────────────────────────────────────────────
const registerSchema = z
  .object({
    full_name:        z.string().min(2, 'Full name must be at least 2 characters'),
    email:            z.string().email('Please enter a valid email address'),
    password:         z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
    lender_id:        z.string().min(1, 'Please select a lender'),
    position:         z.string().min(2, 'Position is required'),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path:    ['confirm_password'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

// ── Input class helper ────────────────────────────────────────────────────
const inputClass = (hasError: boolean) =>
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

  const [showPassword,  setShowPassword]  = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [isSubmitting,  setIsSubmitting]  = useState(false)
  const [lenders,       setLenders]       = useState<Lender[]>([])
  const [loadingLenders, setLoadingLenders] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  // ── Fetch lenders for dropdown ──────────────────────────────────────
  useEffect(() => {
    const fetchLenders = async () => {
      try {
        const data = await lendersApi.getAll()
        setLenders(data)
      } catch {
        toast.error('Could not load lenders. Please refresh and try again.')
      } finally {
        setLoadingLenders(false)
      }
    }
    fetchLenders()
  }, [])

  // ── Submit ──────────────────────────────────────────────────────────
  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)
    try {
      // Step 1 — create user account with loan_officer role
      const newUser = await authApi.register({
        email:    data.email,
        password: data.password,
        role:     'loan_officer',
      })

      // Step 2 — create lender staff record linking user to lender
      await lenderStaffApi.create({
        user_id:   newUser.user_id,
        lender_id: data.lender_id,
        full_name: data.full_name,
        position:  data.position,
      })

      toast.success(`Loan officer account created for ${data.full_name}.`)
      router.replace('/admin/lender-staff')
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to create account. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[440px]">

      {/* Logo + title */}
      <div className="mb-8 flex flex-col items-center gap-3 opacity-0 animate-fade-up [animation-fill-mode:forwards]">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card shadow-card">
          <TrendingUp className="h-7 w-7 text-foreground" strokeWidth={1.75} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            LoanApp
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a Loan Officer Account
          </p>
        </div>
      </div>

      {/* Main card */}
      <div
        className={cn(
          'surface-card rounded-xl p-8 shadow-card-md',
          'opacity-0 animate-fade-up delay-100 [animation-fill-mode:forwards]'
        )}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted">
              <UserPlus className="h-5 w-5 text-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              New loan officer
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fill in the details to register a loan officer and assign them to a lender.
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
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
              placeholder="officer@lender.co.zw"
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

          {/* Lender + Position side by side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Lender */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Lender
              </label>
              <select
                {...register('lender_id')}
                disabled={loadingLenders}
                className={cn(
                  inputClass(!!errors.lender_id),
                  'cursor-pointer',
                  loadingLenders && 'opacity-60'
                )}
              >
                <option value="">
                  {loadingLenders ? 'Loading…' : 'Select lender'}
                </option>
                {lenders.map((l) => (
                  <option key={l.lender_id} value={l.lender_id}>
                    {l.name}
                  </option>
                ))}
              </select>
              {errors.lender_id && (
                <p className="text-xs text-destructive">
                  {errors.lender_id.message}
                </p>
              )}
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Position
              </label>
              <input
                type="text"
                placeholder="e.g. Loan Officer"
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

          {/* Divider */}
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-xs text-muted-foreground">
                Account credentials
              </span>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
                {...register('password')}
                className={cn(inputClass(!!errors.password), 'pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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

          {/* Confirm password */}
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
                className={cn(inputClass(!!errors.confirm_password), 'pr-10')}
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

          {/* Info note */}
          <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            The officer will be prompted to change this password on their first login.
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || loadingLenders}
            className={cn(
              'mt-2 flex h-10 w-full items-center justify-center gap-2',
              'rounded-lg bg-primary text-sm font-medium text-primary-foreground',
              'shadow-sm transition-opacity duration-150',
              'hover:opacity-90',
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
              <>
                <UserPlus className="h-4 w-4" />
                Create loan officer
              </>
            )}
          </button>
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