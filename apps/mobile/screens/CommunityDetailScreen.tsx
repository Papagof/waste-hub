import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import type { CollectionStatus, Tables } from "@waste-hub/shared-types"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"

type Resident = Pick<Tables<"residents">, "id" | "full_name" | "house_unit_number" | "status">
type ResidentStatusRow = Pick<Tables<"resident_payment_status">, "resident_id" | "compliance_status">

const COMPLIANCE_COLORS: Record<string, string> = {
  current: "#0ca30c",
  grace_period: "#fab219",
  overdue: "#d03b3b",
}

export function CommunityDetailScreen({
  community,
  onBack,
  onSelectResident,
}: {
  community: { id: string; name: string }
  onBack: () => void
  onSelectResident: (resident: Resident) => void
}) {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [residents, setResidents] = useState<Resident[]>([])
  const [statuses, setStatuses] = useState<Map<string, string | null>>(new Map())
  const [loggingStatus, setLoggingStatus] = useState<CollectionStatus | null>(null)

  const load = useCallback(async () => {
    const { data: residentRows } = await supabase
      .from("residents")
      .select("id, full_name, house_unit_number, status")
      .eq("community_id", community.id)
      .order("house_unit_number")
      .returns<Resident[]>()
    setResidents(residentRows ?? [])

    const ids = (residentRows ?? []).map((r) => r.id)
    if (ids.length > 0) {
      const { data: statusRows } = await supabase
        .from("resident_payment_status")
        .select("resident_id, compliance_status")
        .in("resident_id", ids)
        .returns<ResidentStatusRow[]>()
      setStatuses(
        new Map(
          (statusRows ?? [])
            .filter((s): s is ResidentStatusRow & { resident_id: string } => s.resident_id !== null)
            .map((s) => [s.resident_id, s.compliance_status]),
        ),
      )
    }
  }, [community.id])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const logCollection = async (status: CollectionStatus) => {
    setLoggingStatus(status)
    const { error } = await supabase.from("collection_logs").insert({
      community_id: community.id,
      collector_id: session?.user.id ?? null,
      collection_date: new Date().toISOString().slice(0, 10),
      status,
    })
    setLoggingStatus(null)
    if (error) {
      Alert.alert("Couldn't log collection", error.message)
    } else {
      Alert.alert("Logged", `Collection marked as ${status} for ${community.name}.`)
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
    <FlatList
      data={residents}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backLink}>← Communities</Text>
          </TouchableOpacity>
          <Text style={styles.welcome}>{community.name}</Text>

          <View style={styles.logRow}>
            {(["completed", "missed", "rescheduled"] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.logButton}
                disabled={loggingStatus !== null}
                onPress={() => logCollection(status)}
              >
                {loggingStatus === status ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Text style={styles.logButtonText}>Log {status}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Residents</Text>
        </View>
      }
      renderItem={({ item }) => {
        const compliance = statuses.get(item.id)
        return (
          <TouchableOpacity style={styles.residentRow} onPress={() => onSelectResident(item)}>
            <View>
              <Text style={styles.residentName}>{item.full_name}</Text>
              <Text style={styles.muted}>Unit {item.house_unit_number}</Text>
            </View>
            {compliance && (
              <Text style={{ color: COMPLIANCE_COLORS[compliance] ?? "#71717a", fontSize: 12, fontWeight: "600" }}>
                {compliance.replace("_", " ")}
              </Text>
            )}
          </TouchableOpacity>
        )
      }}
      ListEmptyComponent={<Text style={styles.muted}>No residents yet.</Text>}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, gap: 8 },
  backLink: { fontSize: 14, color: "#71717a", marginBottom: 8 },
  welcome: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  muted: { fontSize: 13, color: "#71717a" },
  logRow: { flexDirection: "row", gap: 8 },
  logButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  logButtonText: { fontSize: 12, fontWeight: "600" },
  residentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    paddingVertical: 12,
  },
  residentName: { fontSize: 14, fontWeight: "600" },
})
