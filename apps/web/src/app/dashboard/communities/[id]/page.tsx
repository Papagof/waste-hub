import Link from "next/link"
import { notFound } from "next/navigation"
import type { Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { CommunityForm } from "../community-form"

const COMPLIANCE_STYLES: Record<string, string> = {
  current: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  grace_period: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  inactive: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
  suspended: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
}

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: community }, { data: billingPlans }, { data: residents }, { data: statuses }] =
    await Promise.all([
      supabase.from("communities").select("*").eq("id", id).maybeSingle<Tables<"communities">>(),
      supabase.from("billing_plans").select("*").eq("is_active", true).order("name").returns<Tables<"billing_plans">[]>(),
      supabase
        .from("residents")
        .select("*")
        .eq("community_id", id)
        .order("house_unit_number")
        .returns<Tables<"residents">[]>(),
      supabase
        .from("resident_payment_status")
        .select("*")
        .eq("community_id", id)
        .returns<Tables<"resident_payment_status">[]>(),
    ])

  if (!community) {
    notFound()
  }

  const statusByResident = new Map((statuses ?? []).map((status) => [status.resident_id, status]))

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/dashboard/communities" className="text-sm text-zinc-600 underline dark:text-zinc-400">
          ← Communities
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-black dark:text-zinc-50">{community.name}</h1>
      </div>

      <div className="max-w-2xl rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Details</h2>
        <div className="mt-4">
          <CommunityForm community={community} billingPlans={billingPlans ?? []} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Residents</h2>
          <Link
            href={`/dashboard/communities/${id}/residents/new`}
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Add resident
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="border-b border-black/10 text-zinc-600 dark:border-white/10 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Next due</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {residents?.map((resident) => {
                const status = statusByResident.get(resident.id)
                return (
                  <tr key={resident.id}>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{resident.house_unit_number}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/residents/${resident.id}`}
                        className="font-medium text-black underline dark:text-zinc-50"
                      >
                        {resident.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {status?.next_due_date
                        ? new Date(status.next_due_date).toLocaleDateString("en-NG")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          COMPLIANCE_STYLES[status?.compliance_status ?? ""] ??
                          "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                        }`}
                      >
                        {status?.compliance_status ?? resident.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {!residents?.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-500">
                    No residents yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
