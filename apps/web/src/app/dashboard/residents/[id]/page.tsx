import Link from "next/link"
import { notFound } from "next/navigation"
import { formatNaira, type Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { ResidentForm } from "../resident-form"
import { RecordPaymentForm } from "../record-payment-form"

export default async function ResidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: resident } = await supabase
    .from("residents")
    .select("*, communities(id, name)")
    .eq("id", id)
    .maybeSingle<Tables<"residents"> & { communities: { id: string; name: string } | null }>()

  if (!resident) {
    notFound()
  }

  const [{ data: activeBillingPlans }, { data: residentPlan }, { data: paymentStatus }, { data: payments }] =
    await Promise.all([
      supabase.from("billing_plans").select("*").eq("is_active", true).order("name").returns<Tables<"billing_plans">[]>(),
      supabase
        .from("billing_plans")
        .select("*")
        .eq("id", resident.billing_plan_id)
        .maybeSingle<Tables<"billing_plans">>(),
      supabase
        .from("resident_payment_status")
        .select("*")
        .eq("resident_id", id)
        .maybeSingle<Tables<"resident_payment_status">>(),
      supabase
        .from("payments")
        .select("*")
        .eq("resident_id", id)
        .order("period_start", { ascending: false })
        .returns<Tables<"payments">[]>(),
    ])

  return (
    <div className="flex flex-col gap-8">
      <div>
        {resident.communities && (
          <Link
            href={`/dashboard/communities/${resident.communities.id}`}
            className="text-sm text-zinc-600 underline dark:text-zinc-400"
          >
            ← {resident.communities.name}
          </Link>
        )}
        <h1 className="mt-2 text-2xl font-semibold text-black dark:text-zinc-50">{resident.full_name}</h1>
      </div>

      <div className="max-w-2xl rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Details</h2>
        <div className="mt-4">
          <ResidentForm communityId={resident.community_id} resident={resident} billingPlans={activeBillingPlans ?? []} />
        </div>
      </div>

      {residentPlan && (
        <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Record payment</h2>
          <div className="mt-4">
            <RecordPaymentForm
              residentId={id}
              billingPlanId={residentPlan.id}
              cycleType={residentPlan.cycle_type}
              suggestedPeriodStart={paymentStatus?.next_due_date ?? resident.join_date}
              suggestedAmountNaira={residentPlan.amount_kobo / 100}
            />
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Payment history</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
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
              {payments?.map((payment) => (
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
              {!payments?.length && (
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
    </div>
  )
}
