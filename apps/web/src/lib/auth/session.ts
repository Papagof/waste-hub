import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  community_manager: "Community Manager",
  field_agent: "Field Agent",
  resident: "Resident",
  accountant: "Accountant",
}

/** Loads the signed-in user's profile, or redirects to /login if there is none. */
export async function requireProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  return { user, profile }
}
