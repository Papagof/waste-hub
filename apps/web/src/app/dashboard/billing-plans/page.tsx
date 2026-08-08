import { BILLING_CYCLE_LABELS, formatNaira, type Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { setBillingPlanActive } from "@/lib/billing-plans/actions"
import { NewBillingPlanForm } from "./new-plan-form"

export default async function BillingPlansPage() {
  const supabase = await createClient()
  const { data: plans } = await supabase
    .from("billing_plans")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Tables<"billing_plans">[]>()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Billing Plans</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Cycle, price, grace period, and late-fee rules residents subscribe to.
        </p>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">New plan</h2>
        <div className="mt-4">
          <NewBillingPlanForm />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="border-b border-black/10 text-zinc-600 dark:border-white/10 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Cycle</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Grace</th>
              <th className="px-4 py-3 font-medium">Late fee</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 dark:divide-white/10">
            {plans?.map((plan) => (
              <tr key={plan.id}>
                <td className="px-4 py-3 text-black dark:text-zinc-50">{plan.name}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {BILLING_CYCLE_LABELS[plan.cycle_type]}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {formatNaira(plan.amount_kobo)}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {plan.grace_period_days}d
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {formatNaira(plan.late_fee_kobo)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      plan.is_active
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-950 dark:text-green-300"
                        : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                    }
                  >
                    {plan.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form action={setBillingPlanActive.bind(null, plan.id, !plan.is_active)}>
                    <button type="submit" className="text-xs font-medium underline">
                      {plan.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {!plans?.length && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-500">
                  No billing plans yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
