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
import Swal from 'sweetalert2'
import Cookies from 'js-cookie'
import { authApi } from '@/lib/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import type { AxiosError } from 'axios'
import type { AuthUser } from '@/types'

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

// ── API error shape ───────────────────────────────────────────────────────
interface ApiErrorResponse {
  success: false
  message: string
  errors?: { msg: string; path: string }[]
}

// ── Pending auth shape ────────────────────────────────────────────────────
interface PendingAuth {
  token: string
  user:  AuthUser
}

// ── Feature list ──────────────────────────────────────────────────────────


// ── SweetAlert2 theme helper ──────────────────────────────────────────────
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

// ── Cookie helper ─────────────────────────────────────────────────────────
const setCookies = (token: string, role: string) => {
  Cookies.set('token', token, { expires: 7, sameSite: 'strict', path: '/' })
  Cookies.set('role',  role,  { expires: 7, sameSite: 'strict', path: '/' })
}

const clearCookies = () => {
  Cookies.remove('token', { path: '/' })
  Cookies.remove('role',  { path: '/' })
}

// ═══════════════════════════════════════════════════════════════════════════
export default function LoginPage() {
  const router      = useRouter()
  const { setAuth } = useAuthStore()

  const [showPassword,  setShowPassword]  = useState(false)
  const [showNewPw,     setShowNewPw]     = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [step,          setStep]          = useState<'login' | 'change-password'>('login')
  const [isSubmitting,  setIsSubmitting]  = useState(false)
  const [pendingAuth,   setPendingAuth]   = useState<PendingAuth | null>(null)

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

  // ── Redirect helper ───────────────────────────────────────────────────
  const redirectByRole = (role: string) => {
    router.replace(role === 'admin' ? '/admin' : '/officer')
  }

  // ── Submit login ──────────────────────────────────────────────────────
  const onLogin = async (data: LoginFormData) => {
    setIsSubmitting(true)
    try {
      const result = await authApi.login(data)

      // Store token immediately so Axios can use it
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', result.token)
      }

      setPendingAuth(result)

      // Detect first-time login by checking common default passwords
      const isFirstTime =
        data.password === 'admin123' || data.password === 'officer123'

      if (isFirstTime) {
        await Swal.fire({
          icon:              'info',
          title:             'Welcome!',
          html:              `
            <p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">
              Please set a new password to secure your account before continuing.
            </p>
          `,
          confirmButtonText: 'Set password',
          ...swalTheme(),
          customClass: swalCustomClass,
        })
        setStep('change-password')
        return
      }

      // Normal login — persist everything
      setAuth(result.user, result.token)
      setCookies(result.token, result.user.role)

      await Swal.fire({
        icon:             'success',
        title:            'Welcome back!',
        html:             `
          <p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">
            Signed in as <strong>${result.user.email}</strong>
          </p>
        `,
        timer:            1500,
        showConfirmButton: false,
        ...swalTheme(),
        customClass: swalCustomClass,
      })

      redirectByRole(result.user.role)

    } catch (err: unknown) {
      // Clean up on failure
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
      clearCookies()

      const axiosErr = err as AxiosError<ApiErrorResponse>
      const message  =
        axiosErr.response?.data?.message ||
        'Unable to sign in. Please check your credentials.'

      await Swal.fire({
        icon:              'error',
        title:             'Sign in failed',
        html:              `
          <p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">
            ${message}
          </p>
        `,
        confirmButtonText: 'Try again',
        ...swalTheme(),
        customClass: swalCustomClass,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Submit change password ────────────────────────────────────────────
  const onChangePassword = async (data: ChangePasswordFormData) => {
    if (!pendingAuth) return
    setIsSubmitting(true)
    try {
      // Token is already in localStorage from login step above
      await authApi.changePassword({
        current_password: data.current_password,
        new_password:     data.new_password,
      })

      // Now fully commit auth state
      setAuth(pendingAuth.user, pendingAuth.token)
      setCookies(pendingAuth.token, pendingAuth.user.role)

      await Swal.fire({
        icon:              'success',
        title:             'Password updated!',
        html:              `
          <p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">
            Your password has been changed successfully. Welcome!
          </p>
        `,
        timer:             1500,
        showConfirmButton: false,
        ...swalTheme(),
        customClass: swalCustomClass,
      })

      redirectByRole(pendingAuth.user.role)

    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiErrorResponse>
      const message  =
        axiosErr.response?.data?.message ||
        'Failed to update password. Please try again.'

      await Swal.fire({
        icon:              'error',
        title:             'Password update failed',
        html:              `
          <p style="font-size:14px;color:${isDark() ? '#94a3b8' : '#64748b'}">
            ${message}
          </p>
        `,
        confirmButtonText: 'Try again',
        ...swalTheme(),
        customClass: swalCustomClass,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[420px]">

      <div className="mb-8 flex flex-col items-center gap-3 opacity-0 animate-fade-up [animation-fill-mode:forwards]">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card shadow-card">
          <TrendingUp className="h-7 w-7 text-foreground" strokeWidth={1.75} />
        </div>
        <div className="text-center">
          <p className="mt-1 text-sm text-muted-foreground">
            Credit Scoring &amp; Loan Management
          </p>
        </div>
      </div>

      {/* Main card */}
      <div
        className={cn(
          'rounded-xl border border-border bg-card p-8 shadow-card-md',
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
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
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
                  disabled={isSubmitting}
                  className={cn(
                    'flex h-10 flex-1 items-center justify-center rounded-lg border',
                    'border-input bg-background text-sm font-medium text-foreground',
                    'transition-colors hover:bg-muted',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
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