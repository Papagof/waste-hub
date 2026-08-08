"use client"

import { useActionState } from "react"
import { submitComplaint, type FormActionState } from "@/lib/complaints/actions"

const initialState: FormActionState = { error: null }

const CATEGORY_LABELS: Record<string, string> = {
  missed_collection: "Missed collection",
  billing_issue: "Billing issue",
  service_quality: "Service quality",
  other: "Other",
}

export function ComplaintForm({ residentId }: { residentId: string }) {
  const action = submitComplaint.bind(null, residentId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Category
          <select
            name="category"
            required
            defaultValue="missed_collection"
            className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Description
        <textarea
          name="description"
          required
          rows={3}
          placeholder="What happened?"
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {pending ? "Submitting…" : "Submit report"}
      </button>
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
    </form>
  )
}
