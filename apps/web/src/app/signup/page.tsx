"use client"

import Link from "next/link"
import { useActionState } from "react"
import { signUp, type AuthActionState } from "@/lib/auth/actions"

const initialState: AuthActionState = { error: null }

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState)

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-8 dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Create an account</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          New accounts start as residents — staff roles are assigned by an admin afterward.
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Full name
            <input
              type="text"
              name="fullName"
              required
              autoComplete="name"
              className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Password
            <input
              type="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
            />
          </label>

          {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {pending ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-950 underline dark:text-zinc-50">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
