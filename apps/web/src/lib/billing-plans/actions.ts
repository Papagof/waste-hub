"use server"

import { revalidatePath } from "next/cache"
import { nairaToKobo, type BillingCycle } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"

export interface FormActionState {
  error: string | null
}

export async function createBillingPlan(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient()

  const { error } = await supabase.from("billing_plans").insert({
    name: formData.get("name") as string,
    cycle_type: formData.get("cycleType") as BillingCycle,
    amount_kobo: nairaToKobo(Number(formData.get("amountNaira"))),
    grace_period_days: Number(formData.get("gracePeriodDays") || 0),
    late_fee_kobo: nairaToKobo(Number(formData.get("lateFeeNaira") || 0)),
    discount_percent: Number(formData.get("discountPercent") || 0),
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/billing-plans")
  return { error: null }
}

export async function setBillingPlanActive(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from("billing_plans").update({ is_active: isActive }).eq("id", id)
  if (error) {
    throw new Error(error.message)
  }
  revalidatePath("/dashboard/billing-plans")
}
