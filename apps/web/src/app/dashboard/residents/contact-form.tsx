"use client"

import { useActionState } from "react"
import { updateMyContactInfo, type FormActionState } from "@/lib/residents/contact-actions"

const initialState: FormActionState = { error: null, success: false }

export function ContactForm({
  residentId,
  phone,
  email,
}: {
  residentId: string
  phone: string | null
  email: string | null
}) {
  const action = updateMyContactInfo.bind(null, residentId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Phone
        <input
          name="phone"
          defaultValue={phone ?? ""}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Email
        <input
          type="email"
          name="email"
          defaultValue={email ?? ""}
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/15 dark:text-white dark:hover:bg-white/[.08]"
      >
        {pending ? "Saving…" : "Save contact info"}
      </button>
      {state.success && <span className="text-sm text-green-600 dark:text-green-400">Saved.</span>}
      {state.error && <span className="text-sm text-red-600 dark:text-red-400">{state.error}</span>}
    </form>
  )
}
