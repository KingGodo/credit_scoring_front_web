// ─── Auth ──────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'loan_officer' | 'borrower'

export interface User {
  user_id: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface AuthUser {
  user_id: string
  email: string
  role: UserRole
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
}

// ─── Lenders ───────────────────────────────────────────────────────────────
export interface Lender {
  lender_id: string
  name: string
  registration_number: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  created_at: string
}

export interface CreateLenderPayload {
  name: string
  registration_number?: string
  contact_email?: string
  contact_phone?: string
  address?: string
}

// ─── Lender Staff ──────────────────────────────────────────────────────────
export interface LenderStaff {
  staff_id: string
  user_id: string
  lender_id: string
  full_name: string
  position: string
  email: string
  role: UserRole
  lender_name: string
  created_at: string
}

export interface CreateLenderStaffPayload {
  user_id: string
  lender_id: string
  full_name: string
  position: string
}

// ─── Borrowers ─────────────────────────────────────────────────────────────
export interface Borrower {
  borrower_id: string
  user_id: string
  phone: string
  national_id: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface BorrowerProfile {
  profile_id: string
  borrower_id: string
  first_name: string
  last_name: string
  gender: 'male' | 'female' | 'other' | null
  date_of_birth: string | null
  occupation: string | null
  business_type: string | null
  monthly_income: number | null
  years_in_business: number | null
  address: string | null
  phone: string
  national_id: string
  email: string
  created_at: string
}

export type DocumentType =
  | 'national_id'
  | 'passport'
  | 'drivers_license'
  | 'proof_of_address'
  | 'business_license'
  | 'selfie_verification'

export type VerificationStatus = 'pending' | 'verified' | 'rejected'

export interface BorrowerDocument {
  document_id: string
  borrower_id: string
  document_type: DocumentType
  document_url: string
  verification_status: VerificationStatus
  uploaded_at: string
  email?: string
  first_name?: string
  last_name?: string
}

// ─── Loan Products ─────────────────────────────────────────────────────────
export type RepaymentFrequency = 'daily' | 'weekly' | 'bi_weekly' | 'monthly'

export interface LoanProduct {
  product_id: string
  lender_id: string
  product_name: string
  description: string | null
  min_amount: number
  max_amount: number
  interest_rate: number
  term_months: number
  repayment_frequency: RepaymentFrequency
  is_active: boolean
  lender_name: string
  lender_email: string
  created_at: string
}

export interface CreateLoanProductPayload {
  lender_id: string
  product_name: string
  description?: string
  min_amount: number
  max_amount: number
  interest_rate: number
  term_months: number
  repayment_frequency: RepaymentFrequency
}

// ─── Loan Applications ─────────────────────────────────────────────────────
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected'

export interface LoanApplication {
  application_id: string
  borrower_id: string
  product_id: string
  requested_amount: number
  requested_term: number
  application_status: ApplicationStatus
  submitted_at: string
  first_name: string | null
  last_name: string | null
  borrower_email: string
  product_name: string
  interest_rate: number
  lender_name: string
}

export interface CreateLoanApplicationPayload {
  borrower_id: string
  product_id: string
  requested_amount: number
  requested_term: number
}

// ─── Loans ─────────────────────────────────────────────────────────────────
export type LoanStatus = 'active' | 'completed' | 'late' | 'defaulted'

export interface Loan {
  loan_id: string
  application_id: string
  borrower_id: string
  principal_amount: number
  interest_rate: number
  start_date: string
  end_date: string
  loan_status: LoanStatus
  created_at: string
  first_name: string | null
  last_name: string | null
  borrower_email: string
  product_name: string
  repayment_frequency: RepaymentFrequency
  lender_name: string
}

export interface CreateLoanPayload {
  application_id: string
  borrower_id: string
  principal_amount: number
  interest_rate: number
  start_date: string
  end_date: string
}

// ─── Repayment Schedules ───────────────────────────────────────────────────
export type ScheduleStatus = 'pending' | 'paid' | 'overdue' | 'waived'

export interface RepaymentSchedule {
  schedule_id: string
  loan_id: string
  installment_number: number
  due_date: string
  amount_due: number
  status: ScheduleStatus
}

export interface GenerateSchedulePayload {
  loan_id: string
  principal_amount: number
  interest_rate: number
  start_date: string
  term_months: number
}

// ─── Repayments ────────────────────────────────────────────────────────────
export type PaymentMethod = 'mobile_money' | 'bank_transfer' | 'cash'

export interface Repayment {
  repayment_id: string
  loan_id: string
  amount_paid: number
  payment_date: string
  payment_method: PaymentMethod
  recorded_by: string
  created_at: string
  first_name: string | null
  last_name: string | null
  borrower_email: string
  recorded_by_name: string
}

export interface CreateRepaymentPayload {
  loan_id: string
  amount_paid: number
  payment_date: string
  payment_method: PaymentMethod
  recorded_by: string
}

// ─── ML — Model Versions ───────────────────────────────────────────────────
export interface ModelVersion {
  model_id: string
  model_name: string
  model_version: string
  training_dataset: string | null
  created_at: string
}

export interface CreateModelVersionPayload {
  model_name: string
  model_version: string
  training_dataset?: string
}

// ─── ML — Prediction Runs ──────────────────────────────────────────────────
export type PredictionType =
  | 'application_risk'
  | 'borrower_monitoring'
  | 'portfolio_analysis'

export type RiskLevel = 'low' | 'medium' | 'high' | 'very_high'

export interface PredictionRun {
  prediction_id: string
  borrower_id: string
  loan_id: string | null
  application_id: string | null
  model_id: string
  default_probability: number
  credit_score: number
  risk_level: RiskLevel
  prediction_type: PredictionType
  created_at: string
  first_name: string | null
  last_name: string | null
  borrower_email: string
  model_name: string
  model_version: string
}

export interface CreatePredictionPayload {
  borrower_id: string
  model_id: string
  loan_id?: string
  application_id?: string
  default_probability: number
  credit_score: number
  risk_level: RiskLevel
  prediction_type: PredictionType
}

// ─── Audit Logs ────────────────────────────────────────────────────────────
export interface AuditLog {
  log_id: string
  user_id: string
  action: string
  entity: string
  entity_id: string
  created_at: string
  user_email: string
  user_role: UserRole
}

// ─── API Response wrapper ──────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface ApiError {
  success: false
  message: string
  errors?: { msg: string; path: string }[]
}