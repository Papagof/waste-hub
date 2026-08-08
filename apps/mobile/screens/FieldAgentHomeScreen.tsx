import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import type { Tables } from "@waste-hub/shared-types"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"

type Community = Pick<Tables<"communities">, "id" | "name" | "collection_days">

export function FieldAgentHomeScreen({ onSelectCommunity }: { onSelectCommunity: (community: Community) => void }) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [communities, setCommunities] = useState<Community[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase.from("communities").select("id, name, collection_days").order("name")
    setCommunities(data ?? [])
  }, [])

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
      data={communities}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View>
          <Text style={styles.welcome}>Welcome, {profile?.full_name}</Text>
          <Text style={styles.sectionTitle}>Your communities</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => onSelectCommunity(item)}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.collection_days.length > 0 && (
            <Text style={styles.muted}>Scheduled: {item.collection_days.join(", ")}</Text>
          )}
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.muted}>No communities assigned to you yet.</Text>}
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
  sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  muted: { fontSize: 13, color: "#71717a" },
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
