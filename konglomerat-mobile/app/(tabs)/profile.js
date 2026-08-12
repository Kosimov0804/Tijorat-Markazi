import React, { useCallback, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../src/auth";
import { api } from "../../src/api";
import { Button, Card, Screen, SectionTitle } from "../../src/ui";
import { colors } from "../../src/theme";
import { API_BASE } from "../../config";

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.primary} style={{ width: 26 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value || "—"}</Text>
    </View>
  );
}

export default function Profile() {
  const { company, logout } = useAuth();
  const [meeting, setMeeting] = useState(null);

  const load = useCallback(async () => {
    if (!company?.assocId) return;
    const r = await api.conference(company.assocId).catch(() => null);
    setMeeting(r);
  }, [company]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Server javobi turlicha bo'lishi mumkin — link'ni moslashuvchan olamiz
  const meetingUrl =
    meeting?.url || meeting?.link || meeting?.global?.[0]?.url ||
    (Array.isArray(meeting?.meetings) ? meeting.meetings[0]?.url : null);

  return (
    <Screen title="Kabinet" subtitle={company?.name}>
      <ScrollView contentContainerStyle={styles.body}>
        <SectionTitle>Kompaniya ma'lumotlari</SectionTitle>
        <Card>
          <InfoRow icon="business" label="Nomi" value={company?.name} />
          <InfoRow icon="pricetag" label="Soha" value={company?.sector} />
          <InfoRow icon="people" label="Uyushma" value={company?.assocName} />
          <InfoRow icon="person" label="Rais" value={company?.assocChairman} />
        </Card>

        <SectionTitle>Onlayn uchrashuv</SectionTitle>
        <Card>
          {meetingUrl ? (
            <>
              <Text style={styles.meetText}>Uyushma yig'ilishiga qo'shiling</Text>
              <Button
                title="Uchrashuvga kirish"
                onPress={() => Linking.openURL(meetingUrl)}
                style={{ marginTop: 12 }}
              />
            </>
          ) : (
            <Text style={styles.meetText}>Rejalashtirilgan uchrashuv yo'q</Text>
          )}
        </Card>

        <SectionTitle>Ilova</SectionTitle>
        <Card>
          <InfoRow icon="server" label="Server" value={API_BASE.replace("http://", "")} />
          <InfoRow icon="phone-portrait" label="Versiya" value="1.0.0" />
        </Card>

        <Button
          title="Chiqish"
          variant="danger"
          onPress={logout}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 40 },
  infoRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  infoLabel: { color: colors.textDim, fontSize: 14, width: 88 },
  infoValue: { color: colors.text, fontSize: 15, fontWeight: "700", flex: 1, textAlign: "right" },
  meetText: { color: colors.textDim, fontSize: 15 },
});
