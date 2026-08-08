import { formatNaira, type Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { csvResponse, toCsv } from "@/lib/csv"

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("community_payment_summary")
    .select("*")
    .order("community_name")
    .returns<Tables<"community_payment_summary">[]>()

  if (error) {
    return new Response(error.message, { status: 400 })
  }

  const csv = toCsv(data ?? [], [
    { key: "name", label: "Community", value: (c) => c.community_name },
    { key: "total", label: "Total residents", value: (c) => c.total_residents },
    { key: "active", label: "Active residents", value: (c) => c.active_residents },
    { key: "grace", label: "Grace period", value: (c) => c.grace_period_residents },
    { key: "overdue", label: "Overdue", value: (c) => c.overdue_residents },
    {
      key: "revenue",
      label: "Revenue this month",
      value: (c) => formatNaira(Number(c.revenue_this_month_kobo ?? 0)),
    },
  ])

  return csvResponse(csv, "communities.csv")
}
