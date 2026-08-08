"use client"

import { useActionState } from "react"
import { formatNaira, type Tables } from "@waste-hub/shared-types"
import { createCommunity, updateCommunity, type FormActionState } from "@/lib/communities/actions"

const initialState: FormActionState = { error: null }

export function CommunityForm({
  community,
  billingPlans,
}: {
  community?: Tables<"communities">
  billingPlans: Tables<"billing_plans">[]
}) {
  const action = community ? updateCommunity.bind(null, community.id) : createCommunity
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300 sm:col-span-2">
        Name
        <input
          name="name"
          required
          defaultValue={community?.name}
          placeholder="e.g. Happyland Estate"
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Zone
        <input
          name="zone"
          defaultValue={community?.zone ?? ""}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Default billing plan
        <select
          name="defaultBillingPlanId"
          defaultValue={community?.default_billing_plan_id ?? ""}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        >
          <option value="">— None —</option>
          {billingPlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} ({formatNaira(plan.amount_kobo)})
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300 sm:col-span-2">
        Address
        <input
          name="address"
          defaultValue={community?.address ?? ""}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300 sm:col-span-2">
        Collection days (comma-separated)
        <input
          name="collectionDays"
          defaultValue={community?.collection_days?.join(", ") ?? ""}
          placeholder="monday, thursday"
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>

      {state.error && <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-2">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc] sm:col-span-2"
      >
        {pending ? "Saving…" : community ? "Save changes" : "Create community"}
      </button>
    </form>
  )
}
