import { BILLING_CYCLE_LABELS, formatNaira, type Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { ContactForm } from "./residents/contact-form"

const COMPLIANCE_STYLES: Record<string, string> = {
  current: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  grace_period: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

const COMPLIANCE_LABELS: Record<string, string> = {
  current: "Up to date",
  grace_period: "Due — grace period",
  overdue: "Overdue",
}

type ResidentWithRelations = Tables<"residents"> & {
  communities: { name: string } | null
  billing_plans: { name: string; cycle_type: string; amount_kobo: number } | null
}

export async function ResidentView({ userId }: { userId: string }) {
  const supabase = await createClient()

  // Opportunistically link any staff-created resident record that matches
  // this account's email and isn't linked to anyone yet. Safe to call every
  // visit — it's a no-op once already claimed.
  await supabase.rpc("claim_my_resident_records")

  const { data: residents } = await supabase
    .from("residents")
    .select("*, communities(name), billing_plans(name, cycle_type, amount_kobo)")
    .eq("profile_id", userId)
    .returns<ResidentWithRelations[]>()

  if (!residents?.length) {
    return (
      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No resident account is linked to your login yet. This links automatically once your
          estate manager registers you with the same email you signed up with — if you believe
          this is a mistake, contact your estate manager.
        </p>
      </div>
    )
  }

  const residentIds = residents.map((r) => r.id)
  const [{ data: statuses }, { data: payments }] = await Promise.all([
    supabase
      .from("resident_payment_status")
      .select("*")
      .in("resident_id", residentIds)
      .returns<Tables<"resident_payment_status">[]>(),
    supabase
      .from("payments")
      .select("*")
      .in("resident_id", residentIds)
      .order("period_start", { ascending: false })
      .returns<Tables<"payments">[]>(),
  ])
  const statusByResident = new Map((statuses ?? []).map((s) => [s.resident_id, s]))

  return (
    <div className="flex flex-col gap-8">
      {residents.map((resident) => {
        const status = statusByResident.get(resident.id)
        const residentPayments = payments?.filter((p) => p.resident_id === resident.id) ?? []

        return (
          <div key={resident.id} className="flex flex-col gap-6">
            <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
                    {resident.communities?.name ?? "Unknown community"}
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Unit {resident.house_unit_number}</p>
                </div>
                {status && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      COMPLIANCE_STYLES[status.compliance_status ?? ""] ??
                      "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                    }`}
                  >
                    {COMPLIANCE_LABELS[status.compliance_status ?? ""] ?? status.compliance_status}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                {resident.billing_plans && (
                  <div>
                    <div className="text-zinc-500 dark:text-zinc-500">Plan</div>
                    <div className="text-black dark:text-zinc-50">
                      {resident.billing_plans.name} ({BILLING_CYCLE_LABELS[resident.billing_plans.cycle_type as keyof typeof BILLING_CYCLE_LABELS]})
                    </div>
                  </div>
                )}
                {resident.billing_plans && (
                  <div>
                    <div className="text-zinc-500 dark:text-zinc-500">Amount</div>
                    <div className="text-black dark:text-zinc-50">{formatNaira(resident.billing_plans.amount_kobo)}</div>
                  </div>
                )}
                {status?.next_due_date && (
                  <div>
                    <div className="text-zinc-500 dark:text-zinc-500">Next due</div>
                    <div className="text-black dark:text-zinc-50">
                      {new Date(status.next_due_date).toLocaleDateString("en-NG")}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
              <h3 className="text-sm font-semibold text-black dark:text-zinc-50">Contact info</h3>
              <div className="mt-4">
                <ContactForm residentId={resident.id} phone={resident.phone} email={resident.email} />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
              <table className="w-full min-w-max text-left text-sm">
                <thead className="border-b border-black/10 text-zinc-600 dark:border-white/10 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Period</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 dark:divide-white/10">
                  {residentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {new Date(payment.period_start).toLocaleDateString("en-NG")} –{" "}
                        {new Date(payment.period_end).toLocaleDateString("en-NG")}
                      </td>
                      <td className="px-4 py-3 text-black dark:text-zinc-50">
                        {formatNaira(payment.amount_paid_kobo || payment.amount_kobo)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{payment.method}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{payment.status}</td>
                    </tr>
                  ))}
                  {!residentPayments.length && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-500">
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
