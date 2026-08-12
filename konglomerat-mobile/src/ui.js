import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "./theme";

// Har bir tab ekrani uchun sarlavhali fon
export function Screen({ title, subtitle, right, children }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.card }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({ title, onPress, loading, variant = "primary", style }) {
  const bg =
    variant === "ghost" ? "transparent" :
    variant === "danger" ? colors.danger : colors.primary;
  const fg = variant === "ghost" ? colors.primary : "#fff";
  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: pressed || loading ? 0.7 : 1,
          borderWidth: variant === "ghost" ? 1 : 0, borderColor: colors.primary },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Pill({ text, tone = "primary" }) {
  const bg = tone === "accent" ? "#fff4e0" : "#e7f0ff";
  const fg = tone === "accent" ? "#a9700f" : colors.primary;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{text}</Text>
    </View>
  );
}

export function Empty({ text }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function SectionTitle({ children }) {
  return <Text style={styles.section}>{children}</Text>;
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "900" },
  headerSub: { color: colors.textDimOnDark, fontSize: 14, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  btn: {
    height: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  btnText: { fontSize: 16, fontWeight: "700" },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  pillText: { fontSize: 12, fontWeight: "700" },
  empty: { paddingVertical: 40, alignItems: "center" },
  emptyText: { color: colors.textDim, fontSize: 15 },
  section: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
});
