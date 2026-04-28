'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, Save, User, Mail, Phone, IdCard, Calendar, Briefcase, DollarSign, MapPin } from 'lucide-react'
import Swal from 'sweetalert2'
import { cn, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingPage } from '@/components/shared/LoadingSpinner'
import api from '@/lib/axios'

// Types
interface Borrower {
  borrower_id: string
  user_id: string
  phone: string
  national_id: string
}

interface User {
  user_id: string
  email: string
  role: string
  is_active: boolean
}

interface Profile {
  profile_id: string
  first_name: string
  last_name: string
  gender: string
  date_of_birth: string
  occupation?: string
  business_type?: string
  monthly_income?: number
  years_in_business?: number
  address?: string
}

// API helpers
const fetchBorrower = (id: string) => api.get(`/borrowers/${id}`).then(r => r.data.data as Borrower)
const fetchUser = (id: string) => api.get(`/users/${id}`).then(r => r.data.data as User)
const fetchProfile = (borrowerId: string) => api.get(`/borrower-profiles/borrower/${borrowerId}`).then(r => r.data.data as Profile)

const updateUser = (id: string, data: { email: string }) => api.put(`/users/${id}`, data).then(r => r.data.data)
const updateBorrower = (id: string, data: { phone: string; national_id: string }) => api.put(`/borrowers/${id}`, data).then(r => r.data.data)
const updateProfile = (id: string, data: Partial<Profile>) => api.put(`/borrower-profiles/${id}`, data).then(r => r.data.data)

// Validation schemas (same as create)
const userSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const borrowerSchema = z.object({
  phone: z.string().min(10, 'Valid phone number required'),
  national_id: z.string().min(5, 'National ID is required'),
})

const profileSchema = z.object({
  first_name: z.string().min(2, 'First name required'),
  last_name: z.string().min(2, 'Last name required'),
  gender: z.enum(['male', 'female', 'other']),
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

// SweetAlert2 theme (same as before)
const isDark = () => typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
const swalTheme = () => ({
  background: isDark() ? '#111827' : '#ffffff',
  color: isDark() ? '#e2e8f0' : '#0f172a',
  confirmButtonColor: '#7c3aed',
  cancelButtonColor: isDark() ? '#374151' : '#e5e7eb',
})
const swalCustomClass = {
  popup: 'rounded-2xl',
  title: 'text-base font-semibold',
  confirmButton: 'rounded-lg px-5 py-2 text-sm font-medium',
  cancelButton: 'rounded-lg px-5 py-2 text-sm font-medium',
}

// Input class
const inputClass = (hasError?: boolean) => cn(
  'flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm',
  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
  hasError ? 'border-destructive focus:ring-destructive/30' : 'border-input hover:border-ring/50'
)

export default function EditBorrowerPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch existing data
  const { data: borrower, isLoading: borrowerLoading } = useQuery({ queryKey: ['borrower', id], queryFn: () => fetchBorrower(id) })
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', borrower?.user_id],
    queryFn: () => fetchUser(borrower!.user_id),
    enabled: !!borrower?.user_id,
  })
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['borrower-profile', id],
    queryFn: () => fetchProfile(id),
    enabled: !!borrower,
  })

  // Forms
  const userForm = useForm<UserForm>({ resolver: zodResolver(userSchema) })
  const borrowerForm = useForm<BorrowerForm>({ resolver: zodResolver(borrowerSchema) })
  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) })

  // Populate forms when data loads
  React.useEffect(() => {
    if (user) userForm.reset({ email: user.email })
    if (borrower) borrowerForm.reset({ phone: borrower.phone, national_id: borrower.national_id })
    if (profile) {
      profileForm.reset({
        first_name: profile.first_name,
        last_name: profile.last_name,
        gender: profile.gender as any,
        date_of_birth: profile.date_of_birth,
        occupation: profile.occupation || '',
        business_type: profile.business_type || '',
        monthly_income: profile.monthly_income,
        years_in_business: profile.years_in_business,
        address: profile.address || '',
      })
    }
  }, [user, borrower, profile])

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: (data: UserForm) => updateUser(borrower!.user_id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', borrower?.user_id] }),
  })
  const updateBorrowerMutation = useMutation({
    mutationFn: (data: BorrowerForm) => updateBorrower(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['borrower', id] }),
  })
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileForm) => updateProfile(profile!.profile_id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['borrower-profile', id] }),
  })

  const isLoading = borrowerLoading || userLoading || profileLoading

  const handleSubmit = async () => {
    // Validate all forms
    const userValid = await userForm.trigger()
    const borrowerValid = await borrowerForm.trigger()
    const profileValid = await profileForm.trigger()
    if (!userValid || !borrowerValid || !profileValid) return

    // Execute updates in parallel
    const promises = []
    if (userForm.formState.dirtyFields.email) promises.push(updateUserMutation.mutateAsync(userForm.getValues()))
    if (borrowerForm.formState.dirtyFields.phone || borrowerForm.formState.dirtyFields.national_id)
      promises.push(updateBorrowerMutation.mutateAsync(borrowerForm.getValues()))
    if (Object.keys(profileForm.formState.dirtyFields).length)
      promises.push(updateProfileMutation.mutateAsync(profileForm.getValues()))

    if (promises.length === 0) {
      Swal.fire({ icon: 'info', title: 'No changes', text: 'Nothing to update.', ...swalTheme(), customClass: swalCustomClass })
      return
    }

    try {
      await Promise.all(promises)
      await Swal.fire({ icon: 'success', title: 'Borrower updated', timer: 1500, showConfirmButton: false, ...swalTheme(), customClass: swalCustomClass })
      router.push(`/dashboard/officer/borrowers/${id}`)
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Update failed', text: error.response?.data?.message || 'Please try again', ...swalTheme(), customClass: swalCustomClass })
    }
  }

  if (isLoading) return <LoadingPage />
  if (!borrower || !user || !profile) return <div className="p-6 text-center text-destructive">Borrower not found.</div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card p-6 space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Edit Borrower</h2>

        {/* Contact & ID */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">Login & Contact</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input {...userForm.register('email')} className={cn(inputClass(!!userForm.formState.errors.email), 'pl-9')} />
              </div>
              {userForm.formState.errors.email && <p className="text-xs text-destructive mt-1">{userForm.formState.errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input {...borrowerForm.register('phone')} className={cn(inputClass(!!borrowerForm.formState.errors.phone), 'pl-9')} />
              </div>
              {borrowerForm.formState.errors.phone && <p className="text-xs text-destructive mt-1">{borrowerForm.formState.errors.phone.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">National ID</label>
              <div className="relative mt-1">
                <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input {...borrowerForm.register('national_id')} className={cn(inputClass(!!borrowerForm.formState.errors.national_id), 'pl-9')} />
              </div>
              {borrowerForm.formState.errors.national_id && <p className="text-xs text-destructive mt-1">{borrowerForm.formState.errors.national_id.message}</p>}
            </div>
          </div>
        </div>

        {/* Personal details */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">Personal Information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">First name</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input {...profileForm.register('first_name')} className={cn(inputClass(!!profileForm.formState.errors.first_name), 'pl-9')} />
              </div>
              {profileForm.formState.errors.first_name && <p className="text-xs text-destructive mt-1">{profileForm.formState.errors.first_name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Last name</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input {...profileForm.register('last_name')} className={cn(inputClass(!!profileForm.formState.errors.last_name), 'pl-9')} />
              </div>
              {profileForm.formState.errors.last_name && <p className="text-xs text-destructive mt-1">{profileForm.formState.errors.last_name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Gender</label>
              <select {...profileForm.register('gender')} className={cn(inputClass(!!profileForm.formState.errors.gender), 'mt-1')}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {profileForm.formState.errors.gender && <p className="text-xs text-destructive mt-1">{profileForm.formState.errors.gender.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Date of birth</label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="date" {...profileForm.register('date_of_birth')} className={cn(inputClass(!!profileForm.formState.errors.date_of_birth), 'pl-9')} />
              </div>
              {profileForm.formState.errors.date_of_birth && <p className="text-xs text-destructive mt-1">{profileForm.formState.errors.date_of_birth.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Occupation</label>
              <div className="relative mt-1">
                <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input {...profileForm.register('occupation')} className={cn(inputClass(), 'pl-9')} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Business type</label>
              <input {...profileForm.register('business_type')} className={cn(inputClass(), 'mt-1')} />
            </div>
            <div>
              <label className="text-sm font-medium">Monthly income (USD)</label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="number" step="0.01" {...profileForm.register('monthly_income')} className={cn(inputClass(), 'pl-9')} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Years in business</label>
              <input type="number" {...profileForm.register('years_in_business')} className={cn(inputClass(), 'mt-1')} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Address</label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea rows={2} {...profileForm.register('address')} className={cn(inputClass(), 'pl-9 resize-none')} />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-5 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateUserMutation.isPending || updateBorrowerMutation.isPending || updateProfileMutation.isPending}
            className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {updateUserMutation.isPending || updateBorrowerMutation.isPending || updateProfileMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> Save changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}