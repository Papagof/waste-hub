"use client"

import { useActionState } from "react"
import { bulkImportResidents, type BulkImportState } from "@/lib/residents/bulk-import-actions"

const initialState: BulkImportState = { error: null, successCount: 0, failures: [] }

export function ImportForm({ communityId }: { communityId: string }) {
  const action = bulkImportResidents.bind(null, communityId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          CSV file
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="text-sm text-zinc-700 dark:text-zinc-300"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {pending ? "Importing…" : "Import"}
        </button>
      </form>

      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      {(state.successCount > 0 || state.failures.length > 0) && (
        <div className="rounded-lg border border-black/10 bg-white p-4 text-sm dark:border-white/10 dark:bg-zinc-950">
          <p className="text-black dark:text-zinc-50">
            Imported <strong>{state.successCount}</strong> resident{state.successCount === 1 ? "" : "s"}.
            {state.failures.length > 0 && (
              <>
                {" "}
                <strong>{state.failures.length}</strong> row{state.failures.length === 1 ? "" : "s"} failed.
              </>
            )}
          </p>
          {state.failures.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 text-zinc-600 dark:text-zinc-400">
              {state.failures.map((f, i) => (
                <li key={i}>
                  Row {f.rowNumber}: {f.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
