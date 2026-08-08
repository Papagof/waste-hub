"use server"

import { revalidatePath } from "next/cache"
import type { ComplaintCategory, ComplaintStatus } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"

export interface FormActionState {
  error: string | null
}

// community_id is intentionally not set here — a trigger derives it from
// resident_id server-side (see migration 20260807000022_complaints), so a
// resident can never misattribute their own complaint to a community they
// don't belong to.
export async function submitComplaint(
  residentId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient()

  const { error } = await supabase.from("complaints").insert({
    resident_id: residentId,
    category: formData.get("category") as ComplaintCategory,
    description: formData.get("description") as string,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { error: null }
}

export async function resolveComplaint(
  complaintId: string,
  communityId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient()

  const status = formData.get("status") as ComplaintStatus
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("complaints")
    .update({
      status,
      resolution_notes: (formData.get("resolutionNotes") as string) || null,
      resolved_by: status === "resolved" || status === "closed" ? (user?.id ?? null) : null,
      resolved_at: status === "resolved" || status === "closed" ? new Date().toISOString() : null,
    })
    .eq("id", complaintId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/communities/${communityId}`)
  revalidatePath("/dashboard/complaints")
  return { error: null }
}
