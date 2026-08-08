import { koboToNaira, type Tables } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { csvResponse, toCsv } from "@/lib/csv"

type PaymentWithRelations = Tables<"payments"> & {
  residents: { full_name: string; house_unit_number: string } | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const residentId = searchParams.get("residentId")
  const supabase = await createClient()

  let query = supabase
    .from("payments")
    .select("*, residents(full_name, house_unit_number)")
    .order("period_start", { ascending: false })

  if (residentId) query = query.eq("resident_id", residentId)

  const { data, error } = await query.returns<PaymentWithRelations[]>()
  if (error) {
    return new Response(error.message, { status: 400 })
  }

  const csv = toCsv(data ?? [], [
    { key: "resident", label: "Resident", value: (p) => p.residents?.full_name },
    { key: "unit", label: "Unit", value: (p) => p.residents?.house_unit_number },
    { key: "period_start", label: "Period start", value: (p) => p.period_start },
    { key: "period_end", label: "Period end", value: (p) => p.period_end },
    { key: "amount_due", label: "Amount due (NGN)", value: (p) => koboToNaira(p.amount_kobo) },
    { key: "amount_paid", label: "Amount paid (NGN)", value: (p) => koboToNaira(p.amount_paid_kobo) },
    { key: "method", label: "Method", value: (p) => p.method },
    { key: "status", label: "Status", value: (p) => p.status },
    { key: "gateway", label: "Gateway", value: (p) => p.gateway },
    { key: "payment_date", label: "Payment date", value: (p) => p.payment_date },
    { key: "receipt_number", label: "Receipt #", value: (p) => p.receipt_number },
  ])

  return csvResponse(csv, "payments.csv")
}
