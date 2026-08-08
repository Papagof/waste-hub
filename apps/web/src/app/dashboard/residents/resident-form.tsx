"use client"

import { useActionState } from "react"
import { Constants, formatNaira, type Tables } from "@waste-hub/shared-types"
import { createResident, updateResident, type FormActionState } from "@/lib/residents/actions"

const initialState: FormActionState = { error: null }

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
}

export function ResidentForm({
  communityId,
  resident,
  billingPlans,
}: {
  communityId: string
  resident?: Tables<"residents">
  billingPlans: Tables<"billing_plans">[]
}) {
  const action = resident
    ? updateResident.bind(null, resident.id, communityId)
    : createResident.bind(null, communityId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Full name
        <input
          name="fullName"
          required
          defaultValue={resident?.full_name}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Unit / house number
        <input
          name="houseUnitNumber"
          required
          defaultValue={resident?.house_unit_number}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Phone
        <input
          name="phone"
          defaultValue={resident?.phone ?? ""}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Email
        <input
          type="email"
          name="email"
          defaultValue={resident?.email ?? ""}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Billing plan
        <select
          name="billingPlanId"
          required
          defaultValue={resident?.billing_plan_id ?? ""}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        >
          <option value="" disabled>
            Select a plan
          </option>
          {billingPlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} ({formatNaira(plan.amount_kobo)})
            </option>
          ))}
        </select>
      </label>
      {resident && (
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Status
          <select
            name="status"
            defaultValue={resident.status}
            className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
          >
            {Constants.public.Enums.resident_status.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
      )}

      {state.error && <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-2">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc] sm:col-span-2"
      >
        {pending ? "Saving…" : resident ? "Save changes" : "Add resident"}
      </button>
    </form>
  )
}
