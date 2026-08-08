"use server"

import { revalidatePath } from "next/cache"
import type { StaffRole, UserRole } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"

export interface FormActionState {
  error: string | null
}

// community_staff (which community, which staff_role) is what RLS actually
// checks; profiles.role is a coarser label the nav uses to decide what to
// show. Promote resident -> the matching staff role so a newly-assigned
// manager/collector actually sees the staff nav, without ever downgrading
// someone who's already super_admin/accountant/etc.
const PROMOTED_ROLE: Record<StaffRole, UserRole> = {
  manager: "community_manager",
  collector: "field_agent",
}

export async function assignCommunityStaff(
  communityId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient()

  const email = (formData.get("email") as string).trim().toLowerCase()
  const staffRole = formData.get("staffRole") as StaffRole

  const { data: profile, error: lookupError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .maybeSingle()

  if (lookupError) {
    return { error: lookupError.message }
  }
  if (!profile) {
    return { error: "No user found with that email — they need to sign up first." }
  }

  const { error } = await supabase.from("community_staff").insert({
    community_id: communityId,
    profile_id: profile.id,
    staff_role: staffRole,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: "That person already has this role on this community." }
    }
    return { error: error.message }
  }

  if (profile.role === "resident") {
    await supabase.from("profiles").update({ role: PROMOTED_ROLE[staffRole] }).eq("id", profile.id)
  }

  revalidatePath(`/dashboard/communities/${communityId}`)
  return { error: null }
}

export async function removeCommunityStaff(id: string, communityId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("community_staff").delete().eq("id", id)
  if (error) {
    throw new Error(error.message)
  }
  revalidatePath(`/dashboard/communities/${communityId}`)
}
