"use client"

import { useActionState } from "react"
import { BILLING_CYCLE_LABELS, Constants } from "@waste-hub/shared-types"
import { createBillingPlan, type FormActionState } from "@/lib/billing-plans/actions"

const initialState: FormActionState = { error: null }

export function NewBillingPlanForm() {
  const [state, formAction, pending] = useActionState(createBillingPlan, initialState)

  return (
    <form action={formAction} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Name
        <input
          name="name"
          required
          placeholder="e.g. Standard Monthly"
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Cycle
        <select
          name="cycleType"
          required
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        >
          {Constants.public.Enums.billing_cycle.map((cycle) => (
            <option key={cycle} value={cycle}>
              {BILLING_CYCLE_LABELS[cycle]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Amount (₦)
        <input
          type="number"
          name="amountNaira"
          required
          min="0"
          step="0.01"
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Grace period (days)
        <input
          type="number"
          name="gracePeriodDays"
          min="0"
          defaultValue={0}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Late fee (₦)
        <input
          type="number"
          name="lateFeeNaira"
          min="0"
          step="0.01"
          defaultValue={0}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Discount (%)
        <input
          type="number"
          name="discountPercent"
          min="0"
          max="100"
          step="0.01"
          defaultValue={0}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>

      {state.error && <p className="col-span-full text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="col-span-full w-fit rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {pending ? "Creating…" : "Create plan"}
      </button>
    </form>
  )
}
