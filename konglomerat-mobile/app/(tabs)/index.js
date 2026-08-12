import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../src/auth";
import { api } from "../../src/api";
import { Card, Pill, Screen, SectionTitle, Empty } from "../../src/ui";
import { colors } from "../../src/theme";

function Stat({ icon, value, label }) {
  return (
    <Card style={styles.stat}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

export default function Dashboard() {
  const { company, creds } = useAuth();
  const [invest, setInvest] = useState([]);
  const [letters, setLetters] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!creds) return;
    try {
      const [inv, lts] = await Promise.all([
        api.companyItems(creds, "invest").catch(() => ({ items: [] })),
        api.companyLetters(creds).catch(() => ({ letters: [] })),
      ]);
      setInvest(inv.items || []);
      setLetters(lts.letters || []);
    } catch {}
  }, [creds]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen title={company?.name || "Kompaniya"} subtitle={company?.sector || "—"}>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.row}>
          <Stat icon="cube" value={company?.showroom?.length || 0} label="Mahsulot" />
          <Stat icon="rocket" value={invest.length} label="Loyiha" />
          <Stat icon="mail" value={letters.length} label="Xatlar" />
        </View>

        {company?.assocName ? (
          <Card>
            <SectionTitle>Uyushma</SectionTitle>
            <Text style={styles.assocName}>{company.assocName}</Text>
            {company.assocChairman ? (
              <Text style={styles.assocSub}>Rais: {company.assocChairman}</Text>
            ) : null}
          </Card>
        ) : null}

        <SectionTitle>So'nggi rasmiy xatlar</SectionTitle>
        {letters.length === 0 ? (
          <Empty text="Hozircha xatlar yo'q" />
        ) : (
          letters.slice(0, 4).map((l, i) => (
            <Card key={l.id || i}>
              <View style={styles.letterHead}>
                <Pill text={l.from || "Uyushma"} />
                {l.date ? <Text style={styles.letterDate}>{l.date}</Text> : null}
              </View>
              {l.subject ? <Text style={styles.letterSubject}>{l.subject}</Text> : null}
              {l.body ? (
                <Text style={styles.letterBody} numberOfLines={4}>{l.body}</Text>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: "row", gap: 10, marginBottom: 4 },
  stat: { flex: 1, alignItems: "center", paddingVertical: 16, marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: "900", color: colors.text, marginTop: 6 },
  statLabel: { fontSize: 12, color: colors.textDim, marginTop: 2 },
  assocName: { fontSize: 17, fontWeight: "800", color: colors.text },
  assocSub: { fontSize: 14, color: colors.textDim, marginTop: 4 },
  letterHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  letterDate: { color: colors.textDim, fontSize: 12 },
  letterSubject: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 4 },
  letterBody: { fontSize: 14, color: colors.textDim, lineHeight: 20 },
});
