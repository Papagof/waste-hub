import Link from "next/link"
import { requireProfile, ROLE_LABELS } from "@/lib/auth/session"
import { signOut } from "@/lib/auth/actions"

// Communities/residents CRUD is for staff only — RLS also enforces this at
// the data layer, this just keeps the nav from offering links a resident
// or field agent can't use.
const STAFF_ROLES = new Set(["super_admin", "community_manager", "accountant"])
// Matches residents_select RLS (super_admin, manager, collector, accountant).
const RESIDENTS_ROLES = new Set(["super_admin", "community_manager", "field_agent", "accountant"])
// Matches complaints_select RLS (super_admin, manager, collector) — accountant
// isn't part of that policy, so it's excluded here to avoid linking to an
// always-empty page.
const COMPLAINTS_ROLES = new Set(["super_admin", "community_manager", "field_agent"])
// Matches collection_logs_select RLS (super_admin, manager, collector).
const COLLECTIONS_ROLES = new Set(["super_admin", "community_manager", "field_agent"])

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile()
  const isStaff = STAFF_ROLES.has(profile.role)
  const canSeeResidents = RESIDENTS_ROLES.has(profile.role)
  const canSeeComplaints = COMPLAINTS_ROLES.has(profile.role)
  const canSeeCollections = COLLECTIONS_ROLES.has(profile.role)

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-6 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <Link href="/dashboard" className="text-black dark:text-white">
              Waste Hub
            </Link>
            {isStaff && (
              <>
                <Link href="/dashboard/communities" className="hover:text-black dark:hover:text-white">
                  Communities
                </Link>
                <Link href="/dashboard/billing-plans" className="hover:text-black dark:hover:text-white">
                  Billing Plans
                </Link>
              </>
            )}
            {canSeeResidents && (
              <Link href="/dashboard/residents" className="hover:text-black dark:hover:text-white">
                Residents
              </Link>
            )}
            {isStaff && (
              <Link href="/dashboard/reminders" className="hover:text-black dark:hover:text-white">
                Reminders
              </Link>
            )}
            {canSeeCollections && (
              <Link href="/dashboard/collections" className="hover:text-black dark:hover:text-white">
                Collections
              </Link>
            )}
            {canSeeComplaints && (
              <Link href="/dashboard/complaints" className="hover:text-black dark:hover:text-white">
                Complaints
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {profile.full_name} · {ROLE_LABELS[profile.role] ?? profile.role}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-black/15 px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/15 dark:text-white dark:hover:bg-white/[.08]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
    </div>
  )
}
