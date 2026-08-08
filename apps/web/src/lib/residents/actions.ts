"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { ResidentStatus } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"

export interface FormActionState {
  error: string | null
}

export async function createResident(
  communityId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("residents")
    .insert({
      community_id: communityId,
      billing_plan_id: formData.get("billingPlanId") as string,
      full_name: formData.get("fullName") as string,
      house_unit_number: formData.get("houseUnitNumber") as string,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/communities/${communityId}`)
  redirect(`/dashboard/residents/${data.id}`)
}

export async function updateResident(
  id: string,
  communityId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("residents")
    .update({
      billing_plan_id: formData.get("billingPlanId") as string,
      full_name: formData.get("fullName") as string,
      house_unit_number: formData.get("houseUnitNumber") as string,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      status: formData.get("status") as ResidentStatus,
    })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/residents/${id}`)
  revalidatePath(`/dashboard/communities/${communityId}`)
  return { error: null }
}
