"use client"

import { useActionState } from "react"
import { Constants, type BillingCycle } from "@waste-hub/shared-types"
import { createPayment, type FormActionState } from "@/lib/payments/actions"

const initialState: FormActionState = { error: null }

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank transfer",
  mobile_money: "Mobile money",
  ussd: "USSD",
}

const STATUS_LABELS: Record<string, string> = {
  paid: "Paid in full",
  partial: "Partial payment",
  pending: "Invoiced, not yet paid",
}

export function RecordPaymentForm({
  residentId,
  billingPlanId,
  cycleType,
  suggestedPeriodStart,
  suggestedAmountNaira,
}: {
  residentId: string
  billingPlanId: string
  cycleType: BillingCycle
  suggestedPeriodStart: string
  suggestedAmountNaira: number
}) {
  const action = createPayment.bind(null, residentId, billingPlanId, cycleType)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Period start
        <input
          type="date"
          name="periodStart"
          required
          defaultValue={suggestedPeriodStart}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Amount due (₦)
        <input
          type="number"
          name="amountNaira"
          required
          min="0"
          step="0.01"
          defaultValue={suggestedAmountNaira}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Amount received (₦)
        <input
          type="number"
          name="amountPaidNaira"
          min="0"
          step="0.01"
          placeholder="Same as amount due"
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Method
        <select
          name="method"
          required
          defaultValue="cash"
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        >
          {Constants.public.Enums.payment_method.map((method) => (
            <option key={method} value={method}>
              {METHOD_LABELS[method]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Status
        <select
          name="status"
          required
          defaultValue="paid"
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Receipt #
        <input
          name="receiptNumber"
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300 sm:col-span-3">
        Notes
        <textarea
          name="notes"
          rows={2}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>

      {state.error && <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-3">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="col-span-2 w-fit rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc] sm:col-span-3"
      >
        {pending ? "Recording…" : "Record payment"}
      </button>
    </form>
  )
}
