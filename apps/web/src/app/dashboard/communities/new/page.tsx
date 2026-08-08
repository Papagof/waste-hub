import type { Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { CommunityForm } from "../community-form"

export default async function NewCommunityPage() {
  const supabase = await createClient()
  const { data: billingPlans } = await supabase
    .from("billing_plans")
    .select("*")
    .eq("is_active", true)
    .order("name")
    .returns<Tables<"billing_plans">[]>()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">New community</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Add an estate or neighborhood to start registering residents.
        </p>
      </div>

      <div className="max-w-2xl rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
        <CommunityForm billingPlans={billingPlans ?? []} />
      </div>
    </div>
  )
}
