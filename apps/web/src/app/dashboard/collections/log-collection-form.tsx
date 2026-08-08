"use client"

import { useActionState } from "react"
import { Constants } from "@waste-hub/shared-types"
import { logCollection, type FormActionState } from "@/lib/collections/actions"

const initialState: FormActionState = { error: null }

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  missed: "Missed",
  rescheduled: "Rescheduled",
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function LogCollectionForm({ communityId }: { communityId: string }) {
  const action = logCollection.bind(null, communityId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-zinc-700 dark:text-zinc-300">
        Date
        <input
          type="date"
          name="collectionDate"
          defaultValue={todayIso()}
          className="rounded border border-black/15 px-2 py-1.5 text-sm text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-700 dark:text-zinc-300">
        Status
        <select
          name="status"
          defaultValue="completed"
          className="rounded border border-black/15 px-2 py-1.5 text-sm text-black dark:border-white/15 dark:bg-black dark:text-white"
        >
          {Constants.public.Enums.collection_status.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-700 dark:text-zinc-300">
        Notes
        <input
          name="notes"
          placeholder="Optional"
          className="w-48 rounded border border-black/15 px-2 py-1.5 text-sm text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {pending ? "Logging…" : "Log collection"}
      </button>
      {state.error && <span className="w-full text-xs text-red-600 dark:text-red-400">{state.error}</span>}
    </form>
  )
}
