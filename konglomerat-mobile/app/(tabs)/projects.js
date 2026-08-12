import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../src/auth";
import { api } from "../../src/api";
import { Button, Card, Empty, Pill, Screen } from "../../src/ui";
import { colors, radius } from "../../src/theme";

export default function Projects() {
  const { creds } = useAuth();
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", amount: "", status: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!creds) return;
    try {
      const r = await api.companyItems(creds, "invest");
      setItems(r.items || []);
    } catch {}
  }, [creds]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function add() {
    if (!form.title.trim()) return Alert.alert("Loyiha nomini kiriting");
    setBusy(true);
    try {
      const r = await api.companyItems(creds, "invest", { op: "add", ...form });
      setItems(r.items || []);
      setForm({ title: "", body: "", amount: "", status: "" });
      setModal(false);
    } catch (e) {
      Alert.alert("Xatolik", e.message);
    } finally {
      setBusy(false);
    }
  }

  function remove(id, title) {
    Alert.alert("O'chirilsinmi?", title, [
      { text: "Bekor", style: "cancel" },
      { text: "O'chirish", style: "destructive", onPress: async () => {
          try {
            const r = await api.companyItems(creds, "invest", { op: "del", id });
            setItems(r.items || []);
          } catch (e) { Alert.alert("Xatolik", e.message); }
        } },
    ]);
  }

  return (
    <Screen
      title="Investitsiya loyihalari"
      subtitle={`${items.length} ta loyiha`}
      right={
        <Pressable onPress={() => setModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      }
    >
      <ScrollView contentContainerStyle={styles.body}>
        {items.length === 0 ? (
          <Empty text="Loyiha qo'shilmagan. + tugmasini bosing." />
        ) : (
          items.map((it) => (
            <Card key={it.id}>
              <View style={styles.head}>
                <Text style={styles.title}>{it.title}</Text>
                <Pressable onPress={() => remove(it.id, it.title)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={19} color={colors.danger} />
                </Pressable>
              </View>
              <View style={styles.tags}>
                {it.amount ? <Pill text={it.amount} tone="accent" /> : null}
                {it.status ? <Pill text={it.status} /> : null}
              </View>
              {it.body ? <Text style={styles.body2}>{it.body}</Text> : null}
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <View style={styles.sheetWrap}>
          <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>Yangi loyiha</Text>
            {[
              { k: "title", ph: "Loyiha nomi *" },
              { k: "amount", ph: "Investitsiya summasi (masalan: $250 000)" },
              { k: "status", ph: "Holati (masalan: Izlanmoqda / Faol)" },
            ].map((f) => (
              <TextInput
                key={f.k}
                placeholder={f.ph} placeholderTextColor={colors.textDim}
                value={form[f.k]} onChangeText={(v) => setForm({ ...form, [f.k]: v })}
                style={styles.input}
              />
            ))}
            <TextInput
              placeholder="Tavsif / batafsil" placeholderTextColor={colors.textDim}
              value={form.body} onChangeText={(v) => setForm({ ...form, body: v })}
              multiline style={[styles.input, { height: 110, textAlignVertical: "top" }]}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
              <Button title="Bekor" variant="ghost" onPress={() => setModal(false)} style={{ flex: 1 }} />
              <Button title="Qo'shish" onPress={add} loading={busy} style={{ flex: 1 }} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 40 },
  addBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 17, fontWeight: "800", color: colors.text, flex: 1, paddingRight: 8 },
  tags: { flexDirection: "row", gap: 8, marginTop: 8 },
  body2: { fontSize: 14, color: colors.textDim, lineHeight: 20, marginTop: 10 },
  sheetWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  sheetTitle: { fontSize: 20, fontWeight: "900", color: colors.text, marginBottom: 16 },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 14,
    height: 50, fontSize: 15, color: colors.text, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
});
