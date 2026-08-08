"use server"

import { revalidatePath } from "next/cache"
import { computePeriodEnd } from "@waste-hub/payments"
import { nairaToKobo, type BillingCycle, type PaymentMethod, type PaymentStatus } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"

export interface FormActionState {
  error: string | null
}

export async function createPayment(
  residentId: string,
  billingPlanId: string,
  cycleType: BillingCycle,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const periodStart = new Date(formData.get("periodStart") as string)
  if (Number.isNaN(periodStart.getTime())) {
    return { error: "Enter a valid period start date." }
  }
  const periodEnd = computePeriodEnd(periodStart, cycleType)

  const status = formData.get("status") as PaymentStatus
  const amountKobo = nairaToKobo(Number(formData.get("amountNaira")))
  const amountPaidRaw = formData.get("amountPaidNaira")
  const amountPaidKobo = nairaToKobo(Number(amountPaidRaw || formData.get("amountNaira")))

  const { error } = await supabase.from("payments").insert({
    resident_id: residentId,
    billing_plan_id: billingPlanId,
    amount_kobo: amountKobo,
    amount_paid_kobo: status === "pending" ? 0 : amountPaidKobo,
    period_start: periodStart.toISOString().slice(0, 10),
    period_end: periodEnd.toISOString().slice(0, 10),
    payment_date: status === "pending" ? null : new Date().toISOString(),
    method: formData.get("method") as PaymentMethod,
    status,
    gateway: "manual",
    recorded_by: user?.id ?? null,
    receipt_number: (formData.get("receiptNumber") as string) || null,
    notes: (formData.get("notes") as string) || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/residents/${residentId}`)
  revalidatePath("/dashboard/communities")
  return { error: null }
}
