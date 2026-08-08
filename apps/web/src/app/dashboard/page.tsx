import { requireProfile } from "@/lib/auth/session"
import { ResidentView } from "./resident-view"
import { AdminDashboard } from "./admin-dashboard"

export default async function DashboardPage() {
  const { profile } = await requireProfile()

  if (profile.role === "resident") {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Welcome, {profile.full_name}
        </h1>
        <div className="mt-6">
          <ResidentView userId={profile.id} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Welcome, {profile.full_name}
      </h1>
      <div className="mt-6">
        <AdminDashboard />
      </div>
    </div>
  )
}
