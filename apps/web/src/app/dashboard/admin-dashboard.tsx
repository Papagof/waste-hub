import { formatNaira, type Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { RevenueTrendChart, type RevenueTrendPoint } from "./charts/revenue-trend-chart"
import { CommunityBarChart, type CommunityBarDatum } from "./charts/community-bar-chart"

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

export async function AdminDashboard() {
  const supabase = await createClient()

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setUTCDate(1)
  sixMonthsAgo.setUTCHours(0, 0, 0, 0)
  sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 5)

  const [{ data: summaries }, { data: paidPayments }] = await Promise.all([
    supabase.from("community_payment_summary").select("*").returns<Tables<"community_payment_summary">[]>(),
    supabase
      .from("payments")
      .select("amount_paid_kobo, payment_date")
      .eq("status", "paid")
      .gte("payment_date", sixMonthsAgo.toISOString())
      .returns<{ amount_paid_kobo: number; payment_date: string | null }[]>(),
  ])

  const rows = summaries ?? []
  const totalCommunities = rows.length
  const totalActiveResidents = rows.reduce((sum, r) => sum + (r.active_residents ?? 0), 0)
  const totalOverdue = rows.reduce((sum, r) => sum + (r.overdue_residents ?? 0), 0)
  const totalGracePeriod = rows.reduce((sum, r) => sum + (r.grace_period_residents ?? 0), 0)
  const totalCurrent = Math.max(totalActiveResidents - totalOverdue - totalGracePeriod, 0)
  const revenueThisMonthKobo = rows.reduce((sum, r) => sum + Number(r.revenue_this_month_kobo ?? 0), 0)

  const communityBarData: CommunityBarDatum[] = rows
    .map((r) => ({ name: r.community_name ?? "Unknown", value: r.active_residents ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // Build the last 6 month buckets (oldest -> newest) and sum paid revenue into each.
  const monthBuckets = new Map<string, number>()
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo)
    d.setUTCMonth(d.getUTCMonth() + i)
    monthBuckets.set(monthKey(d), 0)
  }
  for (const payment of paidPayments ?? []) {
    if (!payment.payment_date) continue
    const key = monthKey(new Date(payment.payment_date))
    if (monthBuckets.has(key)) {
      monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + payment.amount_paid_kobo)
    }
  }
  const revenueTrend: RevenueTrendPoint[] = Array.from(monthBuckets.entries()).map(([key, amountKobo]) => {
    const monthIndex = Number(key.split("-")[1]) - 1
    return { label: MONTH_LABELS[monthIndex], amountKobo }
  })

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Communities" value={totalCommunities.toLocaleString()} />
        <StatTile label="Active residents" value={totalActiveResidents.toLocaleString()} />
        <StatTile
          label="Overdue accounts"
          value={totalOverdue.toLocaleString()}
          valueClassName={totalOverdue > 0 ? "text-[#d03b3b]" : undefined}
        />
        <StatTile label="Revenue this month" value={formatNaira(revenueThisMonthKobo)} />
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Revenue, last 6 months</h2>
        <div className="mt-4">
          <RevenueTrendChart data={revenueTrend} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Active residents by community</h2>
          <div className="mt-4">
            <CommunityBarChart data={communityBarData} />
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Payment compliance</h2>
          <div className="mt-4 flex flex-col gap-3">
            <ComplianceRow label="Current" value={totalCurrent} colorHex="#0ca30c" />
            <ComplianceRow label="Grace period" value={totalGracePeriod} colorHex="#fab219" />
            <ComplianceRow label="Overdue" value={totalOverdue} colorHex="#d03b3b" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
      <div className="text-xs text-zinc-500 dark:text-zinc-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold text-black dark:text-zinc-50 ${valueClassName ?? ""}`}>
        {value}
      </div>
    </div>
  )
}

function ComplianceRow({ label, value, colorHex }: { label: string; value: number; colorHex: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
        <span
          aria-hidden
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: colorHex }}
        />
        {label}
      </span>
      <span className="font-medium text-black dark:text-zinc-50">{value.toLocaleString()}</span>
    </div>
  )
}
