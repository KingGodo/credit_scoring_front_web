'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  UserPlus,
  Mail,
  Lock,
  Phone,
  IdCard,
  User,
  Calendar,
  Briefcase,
  DollarSign,
  MapPin,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react'
import Swal from 'sweetalert2'
import { PageHeader } from '@/components/shared/PageHeader'
import { cn } from '@/lib/utils'
import api from '@/lib/axios'

// ── API helpers ───────────────────────────────────────────────────────────
const registerUser = (data: { email: string; password: string; role: string }) =>
  api.post('/auth/register', data).then(r => r.data.data)

const createBorrower = (data: { user_id: string; phone: string; national_id: string }) =>
  api.post('/borrowers', data).then(r => r.data.data)

const createBorrowerProfile = (borrowerId: string, data: any) =>
  api.post(`/borrower-profiles/borrower/${borrowerId}`, data).then(r => r.data.data)

// ── Validation schemas ────────────────────────────────────────────────────
const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
})

const borrowerSchema = z.object({
  phone: z.string().min(10, 'Valid phone number required'),
  national_id: z.string().min(5, 'National ID is required'),
})

const profileSchema = z.object({
  first_name: z.string().min(2, 'First name required'),
  last_name: z.string().min(2, 'Last name required'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Select gender' }),
  date_of_birth: z.string().min(1, 'Date of birth required'),
  occupation: z.string().optional(),
  business_type: z.string().optional(),
  monthly_income: z.coerce.number().optional(),
  years_in_business: z.coerce.number().int().min(0).optional(),
  address: z.string().optional(),
})

type UserForm = z.infer<typeof userSchema>
type BorrowerForm = z.infer<typeof borrowerSchema>
type ProfileForm = z.infer<typeof profileSchema>

// ── Form steps ───────────────────────────────────────────────────────────
type Step = 'user' | 'borrower' | 'profile'

// ── Input class ──────────────────────────────────────────────────────────
const inputClass = (hasError?: boolean) =>
  cn(
    'flex h-10 w-full rounded-lg border bg-background px-3 py-2',
    'text-sm text-foreground placeholder:text-muted-foreground',
    'transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
    hasError
      ? 'border-destructive focus:ring-destructive/30'
      : 'border-input hover:border-ring/50'
  )

// ── Section wrapper ──────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export default function CreateBorrowerPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('user')
  const [userId, setUserId] = useState<string | null>(null)
  const [borrowerId, setBorrowerId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Separate forms for each step
  const userForm = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { email: '', password: '' },
  })

  const borrowerForm = useForm<BorrowerForm>({
    resolver: zodResolver(borrowerSchema),
    defaultValues: { phone: '', national_id: '' },
  })

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      gender: undefined,
      date_of_birth: '',
      occupation: '',
      business_type: '',
      monthly_income: undefined,
      years_in_business: undefined,
      address: '',
    },
  })

  // Mutations
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data, variables) => {
      setUserId(data.user_id)
      // Store the password (if provided) to show later. Variables contains plain password.
      // We'll show a success toast later.
      borrowerForm.reset() // clean any previous
      setStep('borrower')
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'User creation failed',
        text: error.response?.data?.message || 'Email may already exist.',
      })
    },
  })

  const borrowerMutation = useMutation({
    mutationFn: createBorrower,
    onSuccess: (data) => {
      setBorrowerId(data.borrower_id)
      setStep('profile')
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Borrower record creation failed',
        text: error.response?.data?.message || 'National ID or phone may be duplicate.',
      })
    },
  })

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) => createBorrowerProfile(borrowerId!, data),
    onSuccess: async (_, variables) => {
      await Swal.fire({
        icon: 'success',
        title: 'Borrower created!',
        html: `
          <div style="text-align: left;">
            <p><strong>Email:</strong> ${userForm.getValues('email')}</p>
            <p><strong>Temporary password:</strong> ${userForm.getValues('password') || 'Use "changeMe123" if auto-generated'}</p>
            <p>Borrower can login with email and this password.</p>
          </div>
        `,
        confirmButtonText: 'Go to borrowers list',
      })
      router.push('/dashboard/officer/borrowers')
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Profile creation failed',
        text: error.response?.data?.message || 'Please try again.',
      })
    },
  })

  // Handlers
  const onUserSubmit = (data: UserForm) => {
    registerMutation.mutate({ ...data, role: 'borrower' })
  }

  const onBorrowerSubmit = (data: BorrowerForm) => {
    if (!userId) return
    borrowerMutation.mutate({ ...data, user_id: userId })
  }

  const onProfileSubmit = (data: ProfileForm) => {
    if (!borrowerId) return
    profileMutation.mutate(data)
  }

  const isProcessing =
    registerMutation.isPending || borrowerMutation.isPending || profileMutation.isPending

  // Date picker helper
  const maxDate = new Date().toISOString().split('T')[0] // today

  return (
    <div>
      <PageHeader
        title="Register Borrower"
        description="Create a new borrower account with personal and business details."
        action={
          <button
            onClick={() => router.push('/dashboard/officer/borrowers')}
            className={cn(
              'flex h-9 items-center gap-2 rounded-lg border border-input',
              'bg-background px-4 text-sm font-medium text-foreground',
              'hover:bg-muted transition-colors'
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to borrowers
          </button>
        }
      />

      <div className="max-w-3xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          {['user', 'borrower', 'profile'].map((s, idx) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : stepOrder(step) > idx
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {stepOrder(step) > idx ? '✓' : idx + 1}
              </div>
              <span className="text-sm capitalize">{s}</span>
              {idx < 2 && <div className="w-8 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: User account */}
        {step === 'user' && (
          <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-6">
            <Section title="Login credentials">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Email address <span className="text-destructive">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="borrower@example.com"
                      {...userForm.register('email')}
                      className={cn(inputClass(!!userForm.formState.errors.email), 'pl-9')}
                    />
                  </div>
                  {userForm.formState.errors.email && (
                    <p className="text-xs text-destructive mt-1">
                      {userForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Temporary password
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Leave empty – auto-generate
                    </span>
                  </div>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••"
                      {...userForm.register('password')}
                      className={cn(inputClass(!!userForm.formState.errors.password), 'pl-9 pr-9')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {userForm.formState.errors.password && (
                    <p className="text-xs text-destructive mt-1">
                      {userForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
              </div>
            </Section>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {registerMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Creating user…</>
                ) : (
                  'Next: Contact info'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Borrower contact & ID */}
        {step === 'borrower' && (
          <form onSubmit={borrowerForm.handleSubmit(onBorrowerSubmit)} className="space-y-6">
            <Section title="Borrower identification">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Phone number <span className="text-destructive">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      placeholder="+263 77 123 4567"
                      {...borrowerForm.register('phone')}
                      className={cn(inputClass(!!borrowerForm.formState.errors.phone), 'pl-9')}
                    />
                  </div>
                  {borrowerForm.formState.errors.phone && (
                    <p className="text-xs text-destructive mt-1">
                      {borrowerForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    National ID <span className="text-destructive">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="63-123456-A-78"
                      {...borrowerForm.register('national_id')}
                      className={cn(inputClass(!!borrowerForm.formState.errors.national_id), 'pl-9')}
                    />
                  </div>
                  {borrowerForm.formState.errors.national_id && (
                    <p className="text-xs text-destructive mt-1">
                      {borrowerForm.formState.errors.national_id.message}
                    </p>
                  )}
                </div>
              </div>
            </Section>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep('user')}
                className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-5 text-sm font-medium hover:bg-muted"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={borrowerMutation.isPending}
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {borrowerMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                ) : (
                  'Next: Personal details'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Borrower profile */}
        {step === 'profile' && (
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
            <Section title="Personal information">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">First name *</label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      {...profileForm.register('first_name')}
                      className={cn(inputClass(!!profileForm.formState.errors.first_name), 'pl-9')}
                    />
                  </div>
                  {profileForm.formState.errors.first_name && (
                    <p className="text-xs text-destructive mt-1">{profileForm.formState.errors.first_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Last name *</label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      {...profileForm.register('last_name')}
                      className={cn(inputClass(!!profileForm.formState.errors.last_name), 'pl-9')}
                    />
                  </div>
                  {profileForm.formState.errors.last_name && (
                    <p className="text-xs text-destructive mt-1">{profileForm.formState.errors.last_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Gender *</label>
                  <select
                    {...profileForm.register('gender')}
                    className={cn(inputClass(!!profileForm.formState.errors.gender), 'mt-1.5')}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {profileForm.formState.errors.gender && (
                    <p className="text-xs text-destructive mt-1">{profileForm.formState.errors.gender.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Date of birth *</label>
                  <div className="relative mt-1.5">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="date"
                      max={maxDate}
                      {...profileForm.register('date_of_birth')}
                      className={cn(inputClass(!!profileForm.formState.errors.date_of_birth), 'pl-9')}
                    />
                  </div>
                  {profileForm.formState.errors.date_of_birth && (
                    <p className="text-xs text-destructive mt-1">{profileForm.formState.errors.date_of_birth.message}</p>
                  )}
                </div>
              </div>
            </Section>

            <Section title="Business & financial details">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Occupation</label>
                    <div className="relative mt-1.5">
                      <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input {...profileForm.register('occupation')} className={cn(inputClass(), 'pl-9')} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Business type</label>
                    <input {...profileForm.register('business_type')} className={cn(inputClass(), 'mt-1.5')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Monthly income (USD)</label>
                    <div className="relative mt-1.5">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input type="number" step="0.01" {...profileForm.register('monthly_income')} className={cn(inputClass(), 'pl-9')} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Years in business</label>
                    <input type="number" {...profileForm.register('years_in_business')} className={cn(inputClass(), 'mt-1.5')} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Residential address</label>
                  <div className="relative mt-1.5">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <textarea rows={2} {...profileForm.register('address')} className={cn(inputClass(), 'pl-9 resize-none')} />
                  </div>
                </div>
              </div>
            </Section>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep('borrower')}
                className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-5 text-sm font-medium hover:bg-muted"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={profileMutation.isPending}
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {profileMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Creating borrower…</>
                ) : (
                  <><UserPlus className="h-4 w-4" />Complete registration</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// Helper to compare step order
function stepOrder(step: Step): number {
  const order = { user: 0, borrower: 1, profile: 2 }
  return order[step]
}