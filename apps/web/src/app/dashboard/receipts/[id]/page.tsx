import { notFound } from "next/navigation"
import { BILLING_CYCLE_LABELS, formatNaira, type Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { PrintButton } from "./print-button"

type PaymentWithRelations = Tables<"payments"> & {
  residents: { full_name: string; house_unit_number: string; communities: { name: string } | null } | null
  billing_plans: { name: string; cycle_type: string } | null
}

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: payment } = await supabase
    .from("payments")
    .select("*, residents(full_name, house_unit_number, communities(name)), billing_plans(name, cycle_type)")
    .eq("id", id)
    .maybeSingle<PaymentWithRelations>()

  if (!payment) {
    notFound()
  }

  const receiptNumber = payment.receipt_number ?? payment.id.slice(0, 8).toUpperCase()

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-8 dark:border-white/10 dark:bg-zinc-950 print:border-none print:p-0">
        <div className="flex items-start justify-between border-b border-black/10 pb-6 dark:border-white/10">
          <div>
            <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Waste Hub</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">Payment receipt</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-500 dark:text-zinc-500">Receipt #</p>
            <p className="font-mono text-sm text-black dark:text-zinc-50">{receiptNumber}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-zinc-500 dark:text-zinc-500">Resident</div>
            <div className="text-black dark:text-zinc-50">{payment.residents?.full_name ?? "—"}</div>
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-500">Community / Unit</div>
            <div className="text-black dark:text-zinc-50">
              {payment.residents?.communities?.name ?? "—"} · {payment.residents?.house_unit_number ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-500">Billing plan</div>
            <div className="text-black dark:text-zinc-50">
              {payment.billing_plans?.name ?? "—"}
              {payment.billing_plans?.cycle_type
                ? ` (${BILLING_CYCLE_LABELS[payment.billing_plans.cycle_type as keyof typeof BILLING_CYCLE_LABELS]})`
                : ""}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-500">Period covered</div>
            <div className="text-black dark:text-zinc-50">
              {new Date(payment.period_start).toLocaleDateString("en-NG")} –{" "}
              {new Date(payment.period_end).toLocaleDateString("en-NG")}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-500">Payment date</div>
            <div className="text-black dark:text-zinc-50">
              {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString("en-NG") : "—"}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-500">Method</div>
            <div className="text-black dark:text-zinc-50 capitalize">{payment.method.replace("_", " ")}</div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-6 dark:border-white/10">
          <span className="text-sm text-zinc-500 dark:text-zinc-500">Status: {payment.status}</span>
          <span className="text-2xl font-semibold text-black dark:text-zinc-50">
            {formatNaira(payment.amount_paid_kobo || payment.amount_kobo)}
          </span>
        </div>

        {payment.notes && (
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">Notes: {payment.notes}</p>
        )}
      </div>
    </div>
  )
}
