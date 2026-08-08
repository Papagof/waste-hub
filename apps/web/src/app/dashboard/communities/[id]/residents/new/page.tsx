import Link from "next/link"
import { notFound } from "next/navigation"
import type { Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { ResidentForm } from "@/app/dashboard/residents/resident-form"

export default async function NewResidentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: communityId } = await params
  const supabase = await createClient()

  const [{ data: community }, { data: billingPlans }] = await Promise.all([
    supabase.from("communities").select("id, name").eq("id", communityId).maybeSingle(),
    supabase
      .from("billing_plans")
      .select("*")
      .eq("is_active", true)
      .order("name")
      .returns<Tables<"billing_plans">[]>(),
  ])

  if (!community) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={`/dashboard/communities/${communityId}`}
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          ← {community.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-black dark:text-zinc-50">Add resident</h1>
      </div>

      <div className="max-w-2xl rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
        <ResidentForm communityId={communityId} billingPlans={billingPlans ?? []} />
      </div>
    </div>
  )
}
