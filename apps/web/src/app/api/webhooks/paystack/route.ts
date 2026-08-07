import { NextResponse } from "next/server"
import { PaystackGateway } from "@waste-hub/payments"
import { createAdminClient } from "@/lib/supabase/admin"

// Paystack signs the raw request body, so this must read the raw text
// before any JSON parsing — do not switch this route to `export const dynamic`
// tricks that re-serialize the body first.
export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get("x-paystack-signature") ?? ""

  const gateway = new PaystackGateway({ secretKey })
  if (!gateway.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const event = gateway.parseWebhookEvent(rawBody)
  if (event.status !== "success") {
    // Ignore pending/failed events — the payment row stays pending/overdue
    // until a successful event (or a field agent) marks it paid.
    return NextResponse.json({ received: true })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("payments")
    .update({
      status: "paid",
      amount_paid_kobo: event.amountKobo,
      payment_date: new Date().toISOString(),
    })
    .eq("gateway", "paystack")
    .eq("gateway_reference", event.reference)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
