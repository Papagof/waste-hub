import { BILLING_CYCLE_MONTHS, type BillingCycle } from "@waste-hub/shared-types"

/** Adds the plan's cycle length to a period start date to get the covered period end (inclusive). */
export function computePeriodEnd(periodStart: Date, cycle: BillingCycle): Date {
  const months = BILLING_CYCLE_MONTHS[cycle]
  const end = new Date(periodStart)
  end.setUTCMonth(end.getUTCMonth() + months)
  end.setUTCDate(end.getUTCDate() - 1)
  return end
}

/** Generates a gateway transaction reference that's traceable back to the resident/billing period. */
export function buildPaymentReference(residentId: string, periodStart: Date): string {
  const stamp = periodStart.toISOString().slice(0, 10).replace(/-/g, "")
  const shortId = residentId.replace(/-/g, "").slice(0, 8)
  return `wh-${shortId}-${stamp}-${Date.now().toString(36)}`
}
