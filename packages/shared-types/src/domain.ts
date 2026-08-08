import type { Enums, Tables } from "./database.types"

export type BillingCycle = Enums<"billing_cycle">
export type PaymentStatus = Enums<"payment_status">
export type PaymentMethod = Enums<"payment_method">
export type PaymentGateway = Enums<"payment_gateway">
export type UserRole = Enums<"user_role">
export type StaffRole = Enums<"staff_role">
export type ResidentStatus = Enums<"resident_status">
export type ComplianceStatus = "current" | "grace_period" | "overdue" | ResidentStatus
export type ComplaintCategory = Enums<"complaint_category">
export type ComplaintStatus = Enums<"complaint_status">
export type NotificationType = Enums<"notification_type">
export type NotificationChannel = Enums<"notification_channel">

export type Community = Tables<"communities">
export type Resident = Tables<"residents">
export type BillingPlan = Tables<"billing_plans">
export type Payment = Tables<"payments">
export type CollectionLog = Tables<"collection_logs">
export type Profile = Tables<"profiles">
export type CommunityStaff = Tables<"community_staff">
export type Complaint = Tables<"complaints">
export type NotificationLog = Tables<"notification_log">
export type ResidentPaymentStatus = Tables<"resident_payment_status">
export type CommunityPaymentSummary = Tables<"community_payment_summary">

export const BILLING_CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  bi_monthly: 2,
  quarterly: 3,
  half_yearly: 6,
  yearly: 12,
}

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Monthly",
  bi_monthly: "Bi-Monthly",
  quarterly: "Quarterly",
  half_yearly: "Half-Yearly",
  yearly: "Yearly",
}

/** Converts a kobo amount (minor unit) to a naira display string, e.g. 150000 -> "1,500.00". */
export function koboToNaira(amountKobo: number): string {
  return (amountKobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Converts a naira amount to kobo (minor unit) for storage, rounding to avoid float drift. */
export function nairaToKobo(amountNaira: number): number {
  return Math.round(amountNaira * 100)
}

export function formatNaira(amountKobo: number): string {
  return `₦${koboToNaira(amountKobo)}`
}
