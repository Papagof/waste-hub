import { requireProfile } from "@/lib/auth/session"

export default async function DashboardPage() {
  const { profile } = await requireProfile()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Welcome, {profile.full_name}
      </h1>
      <div className="mt-6 rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Use Communities to manage estates and residents, and Billing Plans to manage
          subscription cycles. The payment dashboard and reminders land here next.
        </p>
      </div>
    </div>
  )
}
