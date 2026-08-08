"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export interface FormActionState {
  error: string | null
}

function parseCollectionDays(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((day) => day.trim().toLowerCase())
    .filter(Boolean)
}

export async function createCommunity(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient()

  const defaultBillingPlanId = formData.get("defaultBillingPlanId") as string

  const { data, error } = await supabase
    .from("communities")
    .insert({
      name: formData.get("name") as string,
      address: (formData.get("address") as string) || null,
      zone: (formData.get("zone") as string) || null,
      collection_days: parseCollectionDays(formData.get("collectionDays")),
      default_billing_plan_id: defaultBillingPlanId || null,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/communities")
  redirect(`/dashboard/communities/${data.id}`)
}

export async function updateCommunity(
  id: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient()

  const defaultBillingPlanId = formData.get("defaultBillingPlanId") as string

  const { error } = await supabase
    .from("communities")
    .update({
      name: formData.get("name") as string,
      address: (formData.get("address") as string) || null,
      zone: (formData.get("zone") as string) || null,
      collection_days: parseCollectionDays(formData.get("collectionDays")),
      default_billing_plan_id: defaultBillingPlanId || null,
    })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/communities/${id}`)
  revalidatePath("/dashboard/communities")
  return { error: null }
}
