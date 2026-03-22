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
  ShieldCheck,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'
import Cookies from 'js-cookie'
import { authApi } from '@/lib/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

// ── Validation schemas ────────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password:     z
      .string()
      .min(6, 'New password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path:    ['confirm_password'],
  })

type LoginFormData          = z.infer<typeof loginSchema>
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

// ── Feature list ──────────────────────────────────────────────────────────
const features = [
  {
    icon:  BarChart3,
    label: 'AI-powered credit scoring',
    sub:   'RandomForest · LightGBM · Logistic Regression',
  },
  {
    icon:  TrendingUp,
    label: 'Real-time default prediction',
    sub:   'Probability scores for every application',
  },
  {
    icon:  ShieldCheck,
    label: 'Full loan lifecycle management',
    sub:   'From application to final repayment',
  },
]

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

// ═══════════════════════════════════════════════════════════════════════════
export default function LoginPage() {
  const router      = useRouter()
  const { setAuth } = useAuthStore()

  const [showPassword,    setShowPassword]    = useState(false)
  const [showNewPw,       setShowNewPw]       = useState(false)
  const [showConfirmPw,   setShowConfirmPw]   = useState(false)
  const [step,            setStep]            = useState<'login' | 'change-password'>('login')
  const [isSubmitting,    setIsSubmitting]    = useState(false)
  const [pendingAuth,     setPendingAuth]     = useState<{
    token: string
    user:  { user_id: string; email: string; role: string }
  } | null>(null)

  // ── Login form ────────────────────────────────────────────────────────
  const {
    register:     loginRegister,
    handleSubmit: handleLoginSubmit,
    formState:    { errors: loginErrors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  // ── Change password form ──────────────────────────────────────────────
  const {
    register:     cpRegister,
    handleSubmit: handleCpSubmit,
    formState:    { errors: cpErrors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  // ── Submit login ──────────────────────────────────────────────────────
  const onLogin = async (data: LoginFormData) => {
    setIsSubmitting(true)
    try {
      const result = await authApi.login(data)
      setPendingAuth(result)

      // Detect first-time login by default password
      const isFirstTime =
        data.password === 'admin123' || data.password === 'officer123'

      if (isFirstTime) {
        toast.info('Welcome! Please set a new password to continue.')
        setStep('change-password')
        return
      }

      // Persist auth
      setAuth(result.user as any, result.token)
      Cookies.set('token', result.token,      { expires: 7, sameSite: 'strict' })
      Cookies.set('role',  result.user.role,  { expires: 7, sameSite: 'strict' })

      toast.success('Welcome back!')
      router.replace(result.user.role === 'admin' ? '/admin' : '/officer')
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          'Unable to sign in. Please check your credentials.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Submit change password ────────────────────────────────────────────
  const onChangePassword = async (data: ChangePasswordFormData) => {
    if (!pendingAuth) return
    setIsSubmitting(true)
    try {
      localStorage.setItem('token', pendingAuth.token)

      await authApi.changePassword({
        current_password: data.current_password,
        new_password:     data.new_password,
      })

      setAuth(pendingAuth.user as any, pendingAuth.token)
      Cookies.set('token', pendingAuth.token,     { expires: 7, sameSite: 'strict' })
      Cookies.set('role',  pendingAuth.user.role, { expires: 7, sameSite: 'strict' })

      toast.success('Password updated. Welcome!')
      router.replace(pendingAuth.user.role === 'admin' ? '/admin' : '/officer')
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to update password.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[420px]">

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
            Credit Scoring &amp; Loan Management
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
        {step === 'login' ? (
          <>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Sign in
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your credentials to access the dashboard
              </p>
            </div>

            {/* Login form */}
            <form
              onSubmit={handleLoginSubmit(onLogin)}
              className="space-y-4"
              noValidate
            >
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@organization.com"
                  {...loginRegister('email')}
                  className={inputClass(!!loginErrors.email)}
                />
                {loginErrors.email && (
                  <p className="text-xs text-destructive">
                    {loginErrors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...loginRegister('password')}
                    className={cn(inputClass(!!loginErrors.password), 'pr-10')}
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
                {loginErrors.password && (
                  <p className="text-xs text-destructive">
                    {loginErrors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
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
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Change password header */}
            <div className="mb-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted">
                <ShieldCheck className="h-5 w-5 text-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Set a new password
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                For security, please change your default password before
                continuing.
              </p>
            </div>

            {/* Change password form */}
            <form
              onSubmit={handleCpSubmit(onChangePassword)}
              className="space-y-4"
              noValidate
            >
              {/* Current password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Current password
                </label>
                <input
                  type="password"
                  placeholder="Your current password"
                  {...cpRegister('current_password')}
                  className={inputClass(!!cpErrors.current_password)}
                />
                {cpErrors.current_password && (
                  <p className="text-xs text-destructive">
                    {cpErrors.current_password.message}
                  </p>
                )}
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    {...cpRegister('new_password')}
                    className={cn(
                      inputClass(!!cpErrors.new_password),
                      'pr-10'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPw
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye    className="h-4 w-4" />}
                  </button>
                </div>
                {cpErrors.new_password && (
                  <p className="text-xs text-destructive">
                    {cpErrors.new_password.message}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    {...cpRegister('confirm_password')}
                    className={cn(
                      inputClass(!!cpErrors.confirm_password),
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
                {cpErrors.confirm_password && (
                  <p className="text-xs text-destructive">
                    {cpErrors.confirm_password.message}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className={cn(
                    'flex h-10 flex-1 items-center justify-center rounded-lg border',
                    'border-input bg-background text-sm font-medium text-foreground',
                    'transition-colors hover:bg-muted',
                    'focus:outline-none focus:ring-2 focus:ring-ring'
                  )}
                >
                  Back
                </button>
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Set password'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Feature pills */}
      <div
        className={cn(
          'mt-6 space-y-2.5',
          'opacity-0 animate-fade-up delay-200 [animation-fill-mode:forwards]'
        )}
      >
        {features.map(({ icon: Icon, label, sub }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-border bg-muted">
              <Icon
                className="h-4 w-4 text-muted-foreground"
                strokeWidth={1.75}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="truncate text-xs text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p
        className={cn(
          'mt-6 text-center text-xs text-muted-foreground',
          'opacity-0 animate-fade-up delay-300 [animation-fill-mode:forwards]'
        )}
      >
        Zimbabwe Informal Sector Credit Scoring System ·{' '}
        <span className="font-mono">v1.0</span>
      </p>
    </div>
  )
}