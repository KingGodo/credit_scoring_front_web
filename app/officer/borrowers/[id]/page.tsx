'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  User,
  Phone,
  IdCard,
  Mail,
  Calendar,
  Briefcase,
  DollarSign,
  MapPin,
  Building2,
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { LoadingPage } from '@/components/shared/LoadingSpinner'
import api from '@/lib/axios'

// Types
interface Borrower {
  borrower_id: string
  user_id: string
  phone: string
  national_id: string
  created_at: string
}

interface User {
  user_id: string
  email: string
  role: string
  is_active: boolean
  created_at: string
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

// Info row component
function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | number; icon: React.ElementType }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="text-sm text-foreground">{value}</dd>
      </div>
    </div>
  )
}

export default function BorrowerDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const borrowerQuery = useQuery({ queryKey: ['borrower', id], queryFn: () => fetchBorrower(id) })
  const userQuery = useQuery({
    queryKey: ['user', borrowerQuery.data?.user_id],
    queryFn: () => fetchUser(borrowerQuery.data!.user_id),
    enabled: !!borrowerQuery.data?.user_id,
  })
  const profileQuery = useQuery({
    queryKey: ['borrower-profile', id],
    queryFn: () => fetchProfile(id),
    enabled: !!borrowerQuery.data,
  })

  const isLoading = borrowerQuery.isLoading || (borrowerQuery.data?.user_id && userQuery.isLoading)
  const error = borrowerQuery.error || userQuery.error || profileQuery.error

  if (isLoading) return <LoadingPage />
  if (error) return <div className="p-6 text-center text-destructive">Failed to load borrower details.</div>

  const borrower = borrowerQuery.data!
  const user = userQuery.data
  const profile = profileQuery.data

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : 'Not provided'

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* Main card */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{fullName}</h1>
              <p className="text-sm text-muted-foreground">Borrower #{borrower.borrower_id.slice(0, 8)}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact & ID */}
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3">Contact & Identification</h2>
            <dl className="divide-y divide-border">
              <InfoRow label="Email" value={user?.email} icon={Mail} />
              <InfoRow label="Phone" value={borrower.phone} icon={Phone} />
              <InfoRow label="National ID" value={borrower.national_id} icon={IdCard} />
              <InfoRow label="Registered on" value={formatDate(borrower.created_at)} icon={Calendar} />
            </dl>
          </section>

          {/* Personal details (from profile) */}
          {profile && (
            <section>
              <h2 className="text-sm font-semibold text-foreground mb-3">Personal Information</h2>
              <dl className="divide-y divide-border">
                <InfoRow label="Full name" value={`${profile.first_name} ${profile.last_name}`} icon={User} />
                <InfoRow label="Gender" value={profile.gender} icon={User} />
                <InfoRow label="Date of birth" value={formatDate(profile.date_of_birth, 'PPP')} icon={Calendar} />
                <InfoRow label="Occupation" value={profile.occupation} icon={Briefcase} />
                <InfoRow label="Business type" value={profile.business_type} icon={Building2} />
                <InfoRow label="Monthly income (USD)" value={profile.monthly_income?.toLocaleString()} icon={DollarSign} />
                <InfoRow label="Years in business" value={profile.years_in_business} icon={Briefcase} />
                <InfoRow label="Address" value={profile.address} icon={MapPin} />
              </dl>
            </section>
          )}

          {/* Actions */}
          <div className="flex justify-end pt-4">
            <button
              onClick={() => router.push(`/dashboard/officer/borrowers/${id}/edit`)}
              className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Edit borrower
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}