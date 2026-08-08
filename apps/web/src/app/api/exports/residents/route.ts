import type { BillingCycle, ResidentStatus, Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { csvResponse, toCsv } from "@/lib/csv"

type ResidentWithRelations = Tables<"residents"> & {
  communities: { name: string } | null
  billing_plans: { cycle_type: string } | null
}

// Mirrors /dashboard/residents' filters exactly, so "Export" downloads the
// same rows currently on screen — everything still runs through the
// caller's own RLS-scoped session, not a service-role bypass.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const supabase = await createClient()

  let query = supabase
    .from("residents")
    .select("*, communities(name), billing_plans!inner(cycle_type)")
    .order("full_name")

  const community = searchParams.get("community")
  const status = searchParams.get("status")
  const cycle = searchParams.get("cycle")
  if (community) query = query.eq("community_id", community)
  if (status) query = query.eq("status", status as ResidentStatus)
  if (cycle) query = query.eq("billing_plans.cycle_type", cycle as BillingCycle)

  const { data: residentsRaw, error } = await query.returns<ResidentWithRelations[]>()
  if (error) {
    return new Response(error.message, { status: 400 })
  }

  const complianceFilter = searchParams.get("compliance")
  const residentIds = (residentsRaw ?? []).map((r) => r.id)
  const { data: statuses } = residentIds.length
    ? await supabase
        .from("resident_payment_status")
        .select("resident_id, compliance_status")
        .in("resident_id", residentIds)
        .returns<{ resident_id: string; compliance_status: string | null }[]>()
    : { data: [] }
  const statusByResident = new Map((statuses ?? []).map((s) => [s.resident_id, s.compliance_status]))

  const residents = (residentsRaw ?? []).filter((r) =>
    complianceFilter ? statusByResident.get(r.id) === complianceFilter : true,
  )

  const csv = toCsv(residents, [
    { key: "full_name", label: "Full name", value: (r) => r.full_name },
    { key: "house_unit_number", label: "Unit", value: (r) => r.house_unit_number },
    { key: "community", label: "Community", value: (r) => r.communities?.name },
    { key: "status", label: "Status", value: (r) => r.status },
    { key: "compliance", label: "Payment status", value: (r) => statusByResident.get(r.id) },
    { key: "cycle", label: "Billing cycle", value: (r) => r.billing_plans?.cycle_type },
    { key: "phone", label: "Phone", value: (r) => r.phone },
    { key: "email", label: "Email", value: (r) => r.email },
    { key: "join_date", label: "Join date", value: (r) => r.join_date },
  ])

  return csvResponse(csv, "residents.csv")
}
