import { formatNaira, type Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { SendReminderButton } from "./send-reminder-button"

const DUE_SOON_WINDOW_DAYS = 3
const LOW_COMPLIANCE_THRESHOLD = 0.3

export default async function RemindersPage() {
  const supabase = await createClient()

  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const [{ data: statuses }, { data: residents }, { data: summaries }, { data: sentToday }] = await Promise.all([
    supabase.from("resident_payment_status").select("*").returns<Tables<"resident_payment_status">[]>(),
    supabase
      .from("residents")
      .select("id, full_name, phone, email, community_id")
      .returns<{ id: string; full_name: string; phone: string | null; email: string | null; community_id: string }[]>(),
    supabase.from("community_payment_summary").select("*").returns<Tables<"community_payment_summary">[]>(),
    supabase
      .from("notification_log")
      .select("resident_id, notification_type")
      .gte("created_at", todayStart.toISOString())
      .returns<{ resident_id: string | null; notification_type: string }[]>(),
  ])

  const residentById = new Map((residents ?? []).map((r) => [r.id, r]))
  const sentTodaySet = new Set((sentToday ?? []).map((n) => `${n.resident_id}:${n.notification_type}`))

  const now = new Date()
  const dueSoonCutoff = new Date(now)
  dueSoonCutoff.setUTCDate(dueSoonCutoff.getUTCDate() + DUE_SOON_WINDOW_DAYS)

  const dueSoon = (statuses ?? []).filter((s) => {
    if (s.compliance_status !== "current" || !s.next_due_date) return false
    const due = new Date(s.next_due_date)
    return due >= now && due <= dueSoonCutoff
  })
  const overdue = (statuses ?? []).filter((s) => s.compliance_status === "overdue")

  const lowComplianceCommunities = (summaries ?? []).filter((c) => {
    const total = c.total_residents ?? 0
    if (total === 0) return false
    return (c.overdue_residents ?? 0) / total > LOW_COMPLIANCE_THRESHOLD
  })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Reminders</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Residents due soon or overdue, and communities with low payment compliance.{" "}
          {process.env.TERMII_API_KEY ? "" : "SMS/email keys aren't configured yet, so sends are logged only."}
        </p>
      </div>

      {lowComplianceCommunities.length > 0 && (
        <div className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/5 p-4">
          <h2 className="text-sm font-semibold text-black dark:text-zinc-50">
            Low compliance ({Math.round(LOW_COMPLIANCE_THRESHOLD * 100)}%+ overdue)
          </h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            {lowComplianceCommunities.map((c) => (
              <li key={c.community_id}>
                {c.community_name}: {c.overdue_residents} of {c.total_residents} residents overdue
              </li>
            ))}
          </ul>
        </div>
      )}

      <ReminderTable
        title={`Overdue (${overdue.length})`}
        rows={overdue}
        residentById={residentById}
        sentTodaySet={sentTodaySet}
        notificationType="overdue_reminder"
      />

      <ReminderTable
        title={`Due within ${DUE_SOON_WINDOW_DAYS} days (${dueSoon.length})`}
        rows={dueSoon}
        residentById={residentById}
        sentTodaySet={sentTodaySet}
        notificationType="due_reminder"
      />
    </div>
  )
}

function ReminderTable({
  title,
  rows,
  residentById,
  sentTodaySet,
  notificationType,
}: {
  title: string
  rows: Tables<"resident_payment_status">[]
  residentById: Map<string, { full_name: string; phone: string | null; email: string | null }>
  sentTodaySet: Set<string>
  notificationType: "due_reminder" | "overdue_reminder"
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-black dark:text-zinc-50">{title}</h2>
      <div className="mt-3 overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="border-b border-black/10 text-zinc-600 dark:border-white/10 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Resident</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Due date</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 dark:divide-white/10">
            {rows.map((row) => {
              if (!row.resident_id) return null
              const resident = residentById.get(row.resident_id)
              return (
                <tr key={row.resident_id}>
                  <td className="px-4 py-3 text-black dark:text-zinc-50">{resident?.full_name ?? row.full_name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.amount_kobo ? formatNaira(row.amount_kobo) : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {row.next_due_date ? new Date(row.next_due_date).toLocaleDateString("en-NG") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <SendReminderButton
                      residentId={row.resident_id}
                      notificationType={notificationType}
                      alreadySent={sentTodaySet.has(`${row.resident_id}:${notificationType}`)}
                    />
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-500">
                  Nobody in this list right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
