import { useState } from "react"
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, View } from "react-native"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { LoginScreen } from "./screens/LoginScreen"
import { ResidentHomeScreen } from "./screens/ResidentHomeScreen"
import { FieldAgentHomeScreen } from "./screens/FieldAgentHomeScreen"
import { CommunityDetailScreen } from "./screens/CommunityDetailScreen"
import { RecordPaymentScreen } from "./screens/RecordPaymentScreen"

type FieldAgentScreen =
  | { name: "communities" }
  | { name: "community"; community: { id: string; name: string } }
  | {
      name: "recordPayment"
      resident: { id: string; full_name: string }
      community: { id: string; name: string }
    }

function FieldAgentNavigator() {
  const [screen, setScreen] = useState<FieldAgentScreen>({ name: "communities" })

  if (screen.name === "communities") {
    return (
      <FieldAgentHomeScreen onSelectCommunity={(community) => setScreen({ name: "community", community })} />
    )
  }

  if (screen.name === "community") {
    return (
      <CommunityDetailScreen
        community={screen.community}
        onBack={() => setScreen({ name: "communities" })}
        onSelectResident={(resident) =>
          setScreen({ name: "recordPayment", resident, community: screen.community })
        }
      />
    )
  }

  return (
    <RecordPaymentScreen resident={screen.resident} onDone={() => setScreen({ name: "community", community: screen.community })} />
  )
}

function Root() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!session) {
    return <LoginScreen />
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  if (profile.role === "resident") {
    return <ResidentHomeScreen />
  }

  return <FieldAgentNavigator />
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <Root />
      </SafeAreaView>
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
})
