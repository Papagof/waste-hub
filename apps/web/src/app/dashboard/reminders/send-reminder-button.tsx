"use client"

import { useActionState } from "react"
import type { NotificationType } from "@waste-hub/shared-types"
import { sendReminder, type FormActionState } from "@/lib/notifications/actions"

const initialState: FormActionState = { error: null }

export function SendReminderButton({
  residentId,
  notificationType,
  alreadySent,
}: {
  residentId: string
  notificationType: NotificationType
  alreadySent: boolean
}) {
  const action = sendReminder.bind(null, residentId, notificationType)
  const [state, formAction, pending] = useActionState(action, initialState)

  if (alreadySent || state.success) {
    return <span className="text-xs text-zinc-500 dark:text-zinc-500">Reminded today</span>
  }

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-black/15 px-3 py-1 text-xs font-medium text-black transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/15 dark:text-white dark:hover:bg-white/[.08]"
      >
        {pending ? "Sending…" : "Send reminder"}
      </button>
      {state.error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.error}</p>}
    </form>
  )
}
