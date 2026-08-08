import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ImportForm } from "./import-form"

export default async function ImportResidentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: communityId } = await params
  const supabase = await createClient()

  const [{ data: community }, { data: billingPlans }] = await Promise.all([
    supabase.from("communities").select("id, name").eq("id", communityId).maybeSingle(),
    supabase.from("billing_plans").select("name").eq("is_active", true).order("name"),
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
        <h1 className="mt-2 text-2xl font-semibold text-black dark:text-zinc-50">Bulk import residents</h1>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">CSV format</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Header row required: <code className="rounded bg-black/[.06] px-1 py-0.5 font-mono text-xs dark:bg-white/[.08]">full_name,house_unit_number,billing_plan_name,phone,email</code>
          . <code className="rounded bg-black/[.06] px-1 py-0.5 font-mono text-xs dark:bg-white/[.08]">phone</code> and{" "}
          <code className="rounded bg-black/[.06] px-1 py-0.5 font-mono text-xs dark:bg-white/[.08]">email</code> are
          optional; the rest are required. billing_plan_name must exactly match an existing active plan name.
        </p>
        {billingPlans && billingPlans.length > 0 ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Active plan names: {billingPlans.map((p) => `"${p.name}"`).join(", ")}
          </p>
        ) : (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            No active billing plans exist yet — create one first.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Upload</h2>
        <div className="mt-4">
          <ImportForm communityId={communityId} />
        </div>
      </div>
    </div>
  )
}
