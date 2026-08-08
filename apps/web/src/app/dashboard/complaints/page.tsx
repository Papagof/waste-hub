import type { Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { ResolveForm } from "./resolve-form"

const CATEGORY_LABELS: Record<string, string> = {
  missed_collection: "Missed collection",
  billing_issue: "Billing issue",
  service_quality: "Service quality",
  other: "Other",
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  closed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
}

const OPEN_STATUSES = new Set(["open", "in_progress"])

type ComplaintWithRelations = Tables<"complaints"> & {
  residents: { full_name: string; house_unit_number: string } | null
  communities: { name: string } | null
}

export default async function ComplaintsPage() {
  const supabase = await createClient()

  const { data: complaints } = await supabase
    .from("complaints")
    .select("*, residents(full_name, house_unit_number), communities(name)")
    .order("created_at", { ascending: false })
    .returns<ComplaintWithRelations[]>()

  const sorted = [...(complaints ?? [])].sort((a, b) => {
    const aOpen = OPEN_STATUSES.has(a.status) ? 0 : 1
    const bOpen = OPEN_STATUSES.has(b.status) ? 0 : 1
    return aOpen - bOpen
  })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Complaints</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Resident-reported issues and missed-collection reports across your communities.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map((complaint) => (
          <div
            key={complaint.id}
            className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-black dark:text-zinc-50">
                  {CATEGORY_LABELS[complaint.category] ?? complaint.category} —{" "}
                  {complaint.residents?.full_name ?? "Unknown resident"} (
                  {complaint.communities?.name ?? "Unknown community"}, Unit{" "}
                  {complaint.residents?.house_unit_number})
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{complaint.description}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                  {new Date(complaint.created_at).toLocaleString("en-NG")}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  STATUS_STYLES[complaint.status] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                }`}
              >
                {complaint.status.replace("_", " ")}
              </span>
            </div>
            <div className="mt-3 border-t border-black/10 pt-3 dark:border-white/10">
              <ResolveForm
                complaintId={complaint.id}
                communityId={complaint.community_id}
                currentStatus={complaint.status}
                currentNotes={complaint.resolution_notes}
              />
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="rounded-lg border border-black/10 bg-white p-6 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-500">
            No complaints reported yet.
          </div>
        )}
      </div>
    </div>
  )
}
