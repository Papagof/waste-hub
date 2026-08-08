import Link from "next/link"
import { BILLING_CYCLE_LABELS, Constants, type BillingCycle, type ResidentStatus, type Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"

const COMPLIANCE_STYLES: Record<string, string> = {
  current: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  grace_period: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  inactive: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
  suspended: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
}

type ResidentWithRelations = Tables<"residents"> & {
  communities: { name: string } | null
  billing_plans: { cycle_type: string } | null
}

export default async function ResidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ community?: string; status?: string; compliance?: string; cycle?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: communities } = await supabase.from("communities").select("id, name").order("name")

  let query = supabase
    .from("residents")
    .select("*, communities(name), billing_plans!inner(cycle_type)")
    .order("full_name")

  if (params.community) query = query.eq("community_id", params.community)
  if (params.status) query = query.eq("status", params.status as ResidentStatus)
  if (params.cycle) query = query.eq("billing_plans.cycle_type", params.cycle as BillingCycle)

  const { data: residentsRaw } = await query.returns<ResidentWithRelations[]>()

  const residentIds = (residentsRaw ?? []).map((r) => r.id)
  const { data: statuses } = residentIds.length
    ? await supabase
        .from("resident_payment_status")
        .select("resident_id, compliance_status")
        .in("resident_id", residentIds)
        .returns<{ resident_id: string; compliance_status: string | null }[]>()
    : { data: [] }
  const statusByResident = new Map((statuses ?? []).map((s) => [s.resident_id, s.compliance_status]))

  const residents = (residentsRaw ?? []).filter((r) => {
    if (!params.compliance) return true
    return statusByResident.get(r.id) === params.compliance
  })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Residents</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Search and filter across every community you have access to.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Community
          <select
            name="community"
            defaultValue={params.community ?? ""}
            className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
          >
            <option value="">All</option>
            {communities?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Status
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
          >
            <option value="">All</option>
            {Constants.public.Enums.resident_status.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Payment status
          <select
            name="compliance"
            defaultValue={params.compliance ?? ""}
            className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
          >
            <option value="">All</option>
            <option value="current">Current</option>
            <option value="grace_period">Grace period</option>
            <option value="overdue">Overdue</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Billing cycle
          <select
            name="cycle"
            defaultValue={params.cycle ?? ""}
            className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
          >
            <option value="">All</option>
            {Constants.public.Enums.billing_cycle.map((c) => (
              <option key={c} value={c}>
                {BILLING_CYCLE_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Filter
        </button>
        {(params.community || params.status || params.compliance || params.cycle) && (
          <Link href="/dashboard/residents" className="text-sm text-zinc-600 underline dark:text-zinc-400">
            Clear
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="border-b border-black/10 text-zinc-600 dark:border-white/10 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Community</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Payment status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 dark:divide-white/10">
            {residents.map((resident) => {
              const compliance = statusByResident.get(resident.id)
              return (
                <tr key={resident.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/residents/${resident.id}`}
                      className="font-medium text-black underline dark:text-zinc-50"
                    >
                      {resident.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {resident.communities?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{resident.house_unit_number}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {STATUS_LABELS[resident.status] ?? resident.status}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        COMPLIANCE_STYLES[compliance ?? ""] ??
                        "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                      }`}
                    >
                      {compliance ?? "—"}
                    </span>
                  </td>
                </tr>
              )
            })}
            {residents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-500">
                  No residents match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
