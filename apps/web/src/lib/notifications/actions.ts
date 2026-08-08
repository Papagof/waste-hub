"use server"

import { revalidatePath } from "next/cache"
import { formatNaira, type NotificationType } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"
import { getEmailSender, getSmsSender } from "./factory"

export interface FormActionState {
  error: string | null
  success?: boolean
}

export async function sendReminder(
  residentId: string,
  notificationType: NotificationType,
  _prevState: FormActionState,
  _formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: resident } = await supabase
    .from("residents")
    .select("id, full_name, phone, email, community_id")
    .eq("id", residentId)
    .single()
  if (!resident) {
    return { error: "Resident not found." }
  }

  const { data: status } = await supabase
    .from("resident_payment_status")
    .select("next_due_date, amount_kobo")
    .eq("resident_id", residentId)
    .maybeSingle()

  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)
  const { data: existing } = await supabase
    .from("notification_log")
    .select("id")
    .eq("resident_id", residentId)
    .eq("notification_type", notificationType)
    .gte("created_at", todayStart.toISOString())
    .maybeSingle()
  if (existing) {
    return { error: "Already reminded today." }
  }

  const dueDate = status?.next_due_date
    ? new Date(status.next_due_date).toLocaleDateString("en-NG")
    : "soon"
  const amount = status?.amount_kobo ? formatNaira(status.amount_kobo) : "your subscription amount"
  const message =
    notificationType === "overdue_reminder"
      ? `Hi ${resident.full_name}, your waste collection payment of ${amount} was due ${dueDate} and is now overdue. Please make payment to avoid service suspension.`
      : `Hi ${resident.full_name}, your waste collection payment of ${amount} is due on ${dueDate}. Please make payment on time.`

  let channel: "sms" | "email"
  let sendResult: { ok: boolean; error?: string }
  if (resident.phone) {
    channel = "sms"
    sendResult = await getSmsSender().send(resident.phone, message)
  } else if (resident.email) {
    channel = "email"
    sendResult = await getEmailSender().send(resident.email, "Waste collection payment reminder", message)
  } else {
    return { error: "Resident has no phone or email on file." }
  }

  await supabase.from("notification_log").insert({
    notification_type: notificationType,
    channel,
    resident_id: residentId,
    community_id: resident.community_id,
    message,
    status: sendResult.ok ? "sent" : "failed",
    sent_by: user?.id ?? null,
  })

  if (!sendResult.ok) {
    return { error: sendResult.error ?? "Failed to send." }
  }

  revalidatePath("/dashboard/reminders")
  return { error: null, success: true }
}
