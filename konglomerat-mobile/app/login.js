import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../src/auth";
import { Button } from "../src/ui";
import { colors, radius } from "../src/theme";
import { APP_NAME, API_BASE } from "../config";

export default function Login() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [loginV, setLoginV] = useState("");
  const [passV, setPassV] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!loginV.trim() || !passV) {
      setErr("Login va parolni kiriting");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      await login(loginV.trim(), passV);
    } catch (e) {
      setErr(e.message || "Kirishda xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 60 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoBox}>
          <Text style={styles.logoK}>K</Text>
        </View>
        <Text style={styles.brand}>{APP_NAME}</Text>
        <Text style={styles.sub}>Kompaniya kabineti</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Login</Text>
          <TextInput
            value={loginV}
            onChangeText={setLoginV}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="kompaniya-login"
            placeholderTextColor={colors.textDimOnDark}
            style={styles.input}
          />
          <Text style={styles.label}>Parol</Text>
          <TextInput
            value={passV}
            onChangeText={setPassV}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textDimOnDark}
            style={styles.input}
            onSubmitEditing={submit}
          />

          {err ? <Text style={styles.err}>{err}</Text> : null}

          <Button title="Kirish" onPress={submit} loading={busy} style={{ marginTop: 8 }} />
        </View>

        <Text style={styles.server}>Server: {API_BASE}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingBottom: 40, minHeight: "100%" },
  logoBox: {
    width: 76, height: 76, borderRadius: 20, alignSelf: "center",
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  logoK: { color: "#fff", fontSize: 42, fontWeight: "900" },
  brand: { color: "#fff", fontSize: 28, fontWeight: "900", textAlign: "center" },
  sub: { color: colors.textDimOnDark, fontSize: 15, textAlign: "center", marginTop: 4, marginBottom: 32 },
  form: {
    backgroundColor: colors.bgSoft, borderRadius: radius.lg, padding: 20,
  },
  label: { color: colors.textDimOnDark, fontSize: 13, fontWeight: "700", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#0b1730", color: "#fff", borderRadius: radius.md,
    paddingHorizontal: 14, height: 50, fontSize: 16,
    borderWidth: 1, borderColor: "#22375f",
  },
  err: { color: "#ff8a8f", marginTop: 12, fontSize: 14, fontWeight: "600" },
  server: { color: colors.textDimOnDark, fontSize: 12, textAlign: "center", marginTop: 24 },
});
