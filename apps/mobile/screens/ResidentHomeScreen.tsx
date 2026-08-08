import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { BILLING_CYCLE_LABELS, formatNaira, type Tables } from "@waste-hub/shared-types"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"

const COMPLIANCE_COLORS: Record<string, string> = {
  current: "#0ca30c",
  grace_period: "#fab219",
  overdue: "#d03b3b",
}

type ResidentWithRelations = Tables<"residents"> & {
  communities: { name: string } | null
  billing_plans: { name: string; cycle_type: string; amount_kobo: number } | null
}

export function ResidentHomeScreen() {
  const { session, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [resident, setResident] = useState<ResidentWithRelations | null>(null)
  const [status, setStatus] = useState<Tables<"resident_payment_status"> | null>(null)
  const [payments, setPayments] = useState<Tables<"payments">[]>([])

  const load = useCallback(async () => {
    if (!session?.user.id) return

    await supabase.rpc("claim_my_resident_records")

    const { data: residentRow } = await supabase
      .from("residents")
      .select("*, communities(name), billing_plans(name, cycle_type, amount_kobo)")
      .eq("profile_id", session.user.id)
      .maybeSingle<ResidentWithRelations>()
    setResident(residentRow)

    if (residentRow) {
      const [{ data: statusRow }, { data: paymentRows }] = await Promise.all([
        supabase
          .from("resident_payment_status")
          .select("*")
          .eq("resident_id", residentRow.id)
          .maybeSingle<Tables<"resident_payment_status">>(),
        supabase
          .from("payments")
          .select("*")
          .eq("resident_id", residentRow.id)
          .order("period_start", { ascending: false })
          .returns<Tables<"payments">[]>(),
      ])
      setStatus(statusRow)
      setPayments(paymentRows ?? [])
    }
  }, [session?.user.id])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <FlatList
      data={payments}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View>
          <Text style={styles.welcome}>Welcome, {profile?.full_name}</Text>

          {!resident ? (
            <View style={styles.card}>
              <Text style={styles.muted}>
                No resident account is linked yet. This links automatically once your estate manager
                registers you with this account&apos;s email.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.cardTitle}>{resident.communities?.name ?? "Unknown community"}</Text>
                    <Text style={styles.muted}>Unit {resident.house_unit_number}</Text>
                  </View>
                  {status?.compliance_status && (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: (COMPLIANCE_COLORS[status.compliance_status] ?? "#71717a") + "22" },
                      ]}
                    >
                      <Text style={{ color: COMPLIANCE_COLORS[status.compliance_status] ?? "#71717a", fontSize: 12, fontWeight: "600" }}>
                        {status.compliance_status.replace("_", " ")}
                      </Text>
                    </View>
                  )}
                </View>
                {resident.billing_plans && (
                  <Text style={styles.muted}>
                    {resident.billing_plans.name} (
                    {BILLING_CYCLE_LABELS[resident.billing_plans.cycle_type as keyof typeof BILLING_CYCLE_LABELS]}) ·{" "}
                    {formatNaira(resident.billing_plans.amount_kobo)}
                  </Text>
                )}
                {status?.next_due_date && (
                  <Text style={styles.muted}>
                    Next due: {new Date(status.next_due_date).toLocaleDateString("en-NG")}
                  </Text>
                )}
              </View>

              <Text style={styles.sectionTitle}>Payment history</Text>
            </>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.paymentRow}>
          <View>
            <Text style={styles.paymentAmount}>{formatNaira(item.amount_paid_kobo || item.amount_kobo)}</Text>
            <Text style={styles.muted}>
              {new Date(item.period_start).toLocaleDateString("en-NG")} –{" "}
              {new Date(item.period_end).toLocaleDateString("en-NG")}
            </Text>
          </View>
          <Text style={styles.muted}>{item.status}</Text>
        </View>
      )}
      ListEmptyComponent={
        resident ? <Text style={[styles.muted, styles.listContent]}>No payments recorded yet.</Text> : null
      }
      ListFooterComponent={
        <TouchableOpacity style={styles.signOutButton} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      }
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, gap: 8 },
  welcome: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  card: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  muted: { fontSize: 13, color: "#71717a" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    paddingVertical: 10,
  },
  paymentAmount: { fontSize: 14, fontWeight: "600" },
  signOutButton: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  signOutText: { fontWeight: "600" },
})
