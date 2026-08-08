"use client"

import { useActionState } from "react"
import { Constants } from "@waste-hub/shared-types"
import { resolveComplaint, type FormActionState } from "@/lib/complaints/actions"

const initialState: FormActionState = { error: null }

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
}

export function ResolveForm({
  complaintId,
  communityId,
  currentStatus,
  currentNotes,
}: {
  complaintId: string
  communityId: string
  currentStatus: string
  currentNotes: string | null
}) {
  const action = resolveComplaint.bind(null, complaintId, communityId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <select
        name="status"
        defaultValue={currentStatus}
        className="rounded border border-black/15 px-2 py-1.5 text-xs text-black dark:border-white/15 dark:bg-black dark:text-white"
      >
        {Constants.public.Enums.complaint_status.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <input
        name="resolutionNotes"
        defaultValue={currentNotes ?? ""}
        placeholder="Response / notes"
        className="w-48 rounded border border-black/15 px-2 py-1.5 text-xs text-black dark:border-white/15 dark:bg-black dark:text-white"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/15 dark:text-white dark:hover:bg-white/[.08]"
      >
        {pending ? "Saving…" : "Update"}
      </button>
      {state.error && <span className="w-full text-xs text-red-600 dark:text-red-400">{state.error}</span>}
    </form>
  )
}
