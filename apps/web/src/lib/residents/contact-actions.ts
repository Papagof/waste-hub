"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export interface FormActionState {
  error: string | null
  success: boolean
}

const initialState: FormActionState = { error: null, success: false }

/**
 * Lets a resident update their own contact info. Scoped to phone/email in
 * both the query (only those columns are set) and, as defense in depth,
 * at the database level — a trigger on residents rejects any other column
 * changing unless the caller is staff. See migration
 * 20260807000021_protect_resident_self_update_columns.
 */
export async function updateMyContactInfo(
  residentId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("residents")
    .update({
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
    })
    .eq("id", residentId)

  if (error) {
    return { ...initialState, error: error.message }
  }

  revalidatePath("/dashboard")
  return { error: null, success: true }
}
