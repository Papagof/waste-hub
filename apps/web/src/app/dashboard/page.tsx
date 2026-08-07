import { redirect } from "next/navigation"
import type { Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/lib/auth/actions"

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  community_manager: "Community Manager",
  field_agent: "Field Agent",
  resident: "Resident",
  accountant: "Accountant",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single<Pick<Tables<"profiles">, "full_name" | "role">>()

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              Welcome, {profile?.full_name ?? user.email}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Role: {profile ? (ROLE_LABELS[profile.role] ?? profile.role) : "—"}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/15 dark:text-white dark:hover:bg-white/[.08]"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-10 rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This is the authenticated landing page. Community/resident management, the
            payment dashboard, and role-specific views land here next.
          </p>
        </div>
      </div>
    </div>
  )
}
