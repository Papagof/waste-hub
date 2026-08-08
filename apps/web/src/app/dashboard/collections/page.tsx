import type { Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { LogCollectionForm } from "./log-collection-form"

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  missed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  rescheduled: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
}

type LogWithCollector = Tables<"collection_logs"> & {
  profiles: { full_name: string } | null
}

export default async function CollectionsPage() {
  const supabase = await createClient()

  const { data: communities } = await supabase
    .from("communities")
    .select("id, name, collection_days")
    .order("name")

  const communityIds = (communities ?? []).map((c) => c.id)
  const { data: logs } = communityIds.length
    ? await supabase
        .from("collection_logs")
        .select("*, profiles(full_name)")
        .in("community_id", communityIds)
        .order("collection_date", { ascending: false })
        .limit(50)
        .returns<LogWithCollector[]>()
    : { data: [] }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Collections</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Log today&apos;s collection run for each of your communities.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {communities?.map((community) => {
          const communityLogs = (logs ?? []).filter((l) => l.community_id === community.id).slice(0, 5)
          return (
            <div
              key={community.id}
              className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-medium text-black dark:text-zinc-50">{community.name}</h2>
                  {community.collection_days.length > 0 && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      Scheduled: {community.collection_days.join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 border-t border-black/10 pt-3 dark:border-white/10">
                <LogCollectionForm communityId={community.id} />
              </div>

              {communityLogs.length > 0 && (
                <ul className="mt-4 flex flex-col divide-y divide-black/10 text-sm dark:divide-white/10">
                  {communityLogs.map((log) => (
                    <li key={log.id} className="flex items-center justify-between gap-4 py-2">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {new Date(log.collection_date).toLocaleDateString("en-NG")}
                        {log.profiles?.full_name ? ` — ${log.profiles.full_name}` : ""}
                        {log.notes ? ` — ${log.notes}` : ""}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                          STATUS_STYLES[log.status] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                        }`}
                      >
                        {log.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
        {!communities?.length && (
          <div className="rounded-lg border border-black/10 bg-white p-6 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-500">
            No communities assigned to you yet.
          </div>
        )}
      </div>
    </div>
  )
}
