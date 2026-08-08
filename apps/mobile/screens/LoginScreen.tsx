import { useState } from "react"
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { supabase } from "../lib/supabase"

export function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const onSubmit = async () => {
    setError(null)
    setPending(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setPending(false)
    if (signInError) {
      setError(signInError.message)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Waste Hub</Text>
      <Text style={styles.subtitle}>Field agent & resident app</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={pending}>
        {pending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#71717a",
    textAlign: "center",
    marginBottom: 16,
  },
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
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  error: {
    color: "#dc2626",
    fontSize: 13,
  },
})
