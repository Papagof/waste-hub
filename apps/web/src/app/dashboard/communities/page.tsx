import Link from "next/link"
import type { Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"

export default async function CommunitiesPage() {
  const supabase = await createClient()

  const [{ data: communities }, { data: summaries }] = await Promise.all([
    supabase.from("communities").select("*").order("name").returns<Tables<"communities">[]>(),
    supabase
      .from("community_payment_summary")
      .select("*")
      .returns<Tables<"community_payment_summary">[]>(),
  ])

  const summaryByCommunity = new Map((summaries ?? []).map((summary) => [summary.community_id, summary]))

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Communities</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Estates and neighborhoods this account serves.
          </p>
        </div>
        <Link
          href="/dashboard/communities/new"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          New community
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="border-b border-black/10 text-zinc-600 dark:border-white/10 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Zone</th>
              <th className="px-4 py-3 font-medium">Residents</th>
              <th className="px-4 py-3 font-medium">Overdue</th>
              <th className="px-4 py-3 font-medium">Grace period</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 dark:divide-white/10">
            {communities?.map((community) => {
              const summary = summaryByCommunity.get(community.id)
              return (
                <tr key={community.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/communities/${community.id}`}
                      className="font-medium text-black underline dark:text-zinc-50"
                    >
                      {community.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{community.zone ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {summary?.active_residents ?? 0} / {summary?.total_residents ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    {summary?.overdue_residents ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-950 dark:text-red-300">
                        {summary.overdue_residents}
                      </span>
                    ) : (
                      <span className="text-zinc-500 dark:text-zinc-500">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {summary?.grace_period_residents ?? 0}
                  </td>
                </tr>
              )
            })}
            {!communities?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-500">
                  No communities yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
