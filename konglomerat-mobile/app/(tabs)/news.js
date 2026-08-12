import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../src/auth";
import { api } from "../../src/api";
import { Card, Empty, Screen } from "../../src/ui";
import { colors } from "../../src/theme";

const LANGS = [
  { k: "uz", label: "O'z" },
  { k: "ru", label: "Ру" },
  { k: "en", label: "En" },
];

function timeAgo(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString();
}

export default function News() {
  const { company, creds } = useAuth();
  const [lang, setLang] = useState("uz");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (lng) => {
    if (!creds) return;
    try {
      const r = await api.sectorNews(creds, lng || lang);
      setItems(r.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [creds, lang]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  function switchLang(k) {
    setLang(k);
    setLoading(true);
    load(k);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen
      title="Yangiliklar"
      subtitle={company?.sector ? `Soha: ${company.sector}` : "Sohangiz bo'yicha AI yangiliklar"}
      right={
        <View style={styles.langRow}>
          {LANGS.map((l) => (
            <Pressable
              key={l.k}
              onPress={() => switchLang(l.k)}
              style={[styles.langBtn, lang === l.k && styles.langActive]}
            >
              <Text style={[styles.langText, lang === l.k && styles.langTextActive]}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      }
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>AI yangiliklarni tayyorlamoqda…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {items.length === 0 ? (
            <Empty text="Yangiliklar topilmadi" />
          ) : (
            items.map((it, i) => (
              <Card key={i}>
                <Text style={styles.date}>{timeAgo(it.time)}</Text>
                <Text style={styles.title}>{it.title}</Text>
                <Text style={styles.body2}>{it.body}</Text>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  loadingText: { color: colors.textDim, marginTop: 14, fontSize: 15 },
  langRow: { flexDirection: "row", backgroundColor: "#0b1730", borderRadius: 10, padding: 3 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  langActive: { backgroundColor: colors.primary },
  langText: { color: colors.textDimOnDark, fontWeight: "800", fontSize: 13 },
  langTextActive: { color: "#fff" },
  date: { color: colors.textDim, fontSize: 12, marginBottom: 4 },
  title: { fontSize: 17, fontWeight: "800", color: colors.text, marginBottom: 6 },
  body2: { fontSize: 14, color: colors.textDim, lineHeight: 21 },
});
