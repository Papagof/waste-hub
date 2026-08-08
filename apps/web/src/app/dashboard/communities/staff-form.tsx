"use client"

import { useActionState } from "react"
import { assignCommunityStaff, type FormActionState } from "@/lib/community-staff/actions"

const initialState: FormActionState = { error: null }

export function AssignStaffForm({ communityId }: { communityId: string }) {
  const action = assignCommunityStaff.bind(null, communityId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        User email
        <input
          type="email"
          name="email"
          required
          placeholder="manager@example.com"
          className="w-64 rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Role
        <select
          name="staffRole"
          required
          defaultValue="manager"
          className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
        >
          <option value="manager">Community Manager</option>
          <option value="collector">Field Agent / Collector</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {pending ? "Assigning…" : "Assign"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600 dark:text-red-400">{state.error}</p>}
    </form>
  )
}
