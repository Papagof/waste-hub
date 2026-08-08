"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn, type AuthActionState } from "@/lib/auth/actions"

const initialState: AuthActionState = { error: null }

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState)
  const searchParams = useSearchParams()
  const checkEmail = searchParams.get("checkEmail")
  const confirmationFailed = searchParams.get("error") === "confirmation-failed"

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-8 dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Waste Hub admin &amp; resident portal</p>

        {checkEmail && (
          <p className="mt-4 rounded bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
            Check your email to confirm your account before signing in.
          </p>
        )}
        {confirmationFailed && (
          <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            That confirmation link is invalid or expired.
          </p>
        )}

        <form action={formAction} className="mt-6 flex flex-col gap-4">
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
              autoComplete="current-password"
              className="rounded border border-black/15 px-3 py-2 text-black dark:border-white/15 dark:bg-black dark:text-white"
            />
          </label>

          {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          No account?{" "}
          <Link href="/signup" className="font-medium text-zinc-950 underline dark:text-zinc-50">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
