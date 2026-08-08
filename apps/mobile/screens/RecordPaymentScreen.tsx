import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { computePeriodEnd } from "@waste-hub/payments"
import { koboToNaira, nairaToKobo, type Tables } from "@waste-hub/shared-types"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"

export function RecordPaymentScreen({
  resident,
  onDone,
}: {
  resident: { id: string; full_name: string }
  onDone: () => void
}) {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<Tables<"billing_plans"> | null>(null)
  const [periodStart, setPeriodStart] = useState<Date>(new Date())
  const [amountNaira, setAmountNaira] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    const [{ data: residentRow }, { data: statusRow }] = await Promise.all([
      supabase.from("residents").select("billing_plan_id, join_date").eq("id", resident.id).single(),
      supabase
        .from("resident_payment_status")
        .select("next_due_date")
        .eq("resident_id", resident.id)
        .maybeSingle(),
    ])
    if (!residentRow) return

    const { data: planRow } = await supabase
      .from("billing_plans")
      .select("*")
      .eq("id", residentRow.billing_plan_id)
      .single<Tables<"billing_plans">>()
    setPlan(planRow)
    setAmountNaira(planRow ? koboToNaira(planRow.amount_kobo) : "")

    const start = statusRow?.next_due_date ?? residentRow.join_date
    setPeriodStart(new Date(start))
  }, [resident.id])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const onSubmit = async () => {
    if (!plan) return
    setSubmitting(true)
    const periodEnd = computePeriodEnd(periodStart, plan.cycle_type)
    const amountKobo = nairaToKobo(Number(amountNaira))

    const { error } = await supabase.from("payments").insert({
      resident_id: resident.id,
      billing_plan_id: plan.id,
      amount_kobo: amountKobo,
      amount_paid_kobo: amountKobo,
      period_start: periodStart.toISOString().slice(0, 10),
      period_end: periodEnd.toISOString().slice(0, 10),
      payment_date: new Date().toISOString(),
      method: "cash",
      status: "paid",
      gateway: "manual",
      recorded_by: session?.user.id ?? null,
    })
    setSubmitting(false)

    if (error) {
      Alert.alert("Couldn't record payment", error.message)
    } else {
      Alert.alert("Recorded", `Cash payment of ₦${amountNaira} recorded for ${resident.full_name}.`)
      onDone()
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onDone}>
        <Text style={styles.backLink}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Record cash payment</Text>
      <Text style={styles.subtitle}>{resident.full_name}</Text>

      {!plan ? (
        <Text style={styles.muted}>No billing plan found for this resident.</Text>
      ) : (
        <>
          <Text style={styles.label}>Period start</Text>
          <Text style={styles.muted}>{periodStart.toLocaleDateString("en-NG")}</Text>

          <Text style={styles.label}>Amount (₦)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={amountNaira}
            onChangeText={setAmountNaira}
          />

          <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Record payment</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { flex: 1, padding: 16, gap: 8, backgroundColor: "#fff" },
  backLink: { fontSize: 14, color: "#71717a", marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#71717a", marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginTop: 8 },
  muted: { fontSize: 13, color: "#71717a" },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#18181b",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
})
