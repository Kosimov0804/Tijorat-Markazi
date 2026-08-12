import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/auth";
import { api } from "../../src/api";
import { Button, Card, Empty, Screen } from "../../src/ui";
import { colors, radius } from "../../src/theme";
import { API_BASE } from "../../config";

export default function Showroom() {
  const { company, setCompany, creds } = useAuth();
  const items = company?.showroom || [];
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", desc: "" });
  const [busy, setBusy] = useState(false);

  async function persist(next) {
    setBusy(true);
    try {
      const r = await api.saveShowroom(creds, next);
      setCompany({ ...company, showroom: r.showroom });
    } catch (e) {
      Alert.alert("Xatolik", e.message);
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    if (!form.name.trim()) return Alert.alert("Nomini kiriting");
    await persist([...items, { ...form, img: "" }]);
    setForm({ name: "", price: "", desc: "" });
    setModal(false);
  }

  function remove(idx) {
    Alert.alert("O'chirilsinmi?", items[idx]?.name || "", [
      { text: "Bekor", style: "cancel" },
      { text: "O'chirish", style: "destructive",
        onPress: () => persist(items.filter((_, i) => i !== idx)) },
    ]);
  }

  return (
    <Screen
      title="Showroom"
      subtitle={`${items.length} ta mahsulot / xizmat`}
      right={
        <Pressable onPress={() => setModal(true)} style={styles.addBtn}>
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      }
    >
      <ScrollView contentContainerStyle={styles.body}>
        {items.length === 0 ? (
          <Empty text="Mahsulot qo'shilmagan. + tugmasini bosing." />
        ) : (
          items.map((it, i) => (
            <Card key={i} style={styles.item}>
              {it.img ? (
                <Image
                  source={{ uri: it.img.startsWith("http") ? it.img : API_BASE + it.img }}
                  style={styles.thumb}
                />
              ) : (
                <View style={[styles.thumb, styles.thumbEmpty]}>
                  <Ionicons name="cube-outline" size={28} color={colors.textDim} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{it.name}</Text>
                {it.price ? <Text style={styles.itemPrice}>{it.price}</Text> : null}
                {it.desc ? (
                  <Text style={styles.itemDesc} numberOfLines={2}>{it.desc}</Text>
                ) : null}
              </View>
              <Pressable onPress={() => remove(i)} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Yangi mahsulot</Text>
            <TextInput
              placeholder="Nomi *" placeholderTextColor={colors.textDim}
              value={form.name} onChangeText={(v) => setForm({ ...form, name: v })}
              style={styles.input}
            />
            <TextInput
              placeholder="Narxi (masalan: 120 000 so'm)" placeholderTextColor={colors.textDim}
              value={form.price} onChangeText={(v) => setForm({ ...form, price: v })}
              style={styles.input}
            />
            <TextInput
              placeholder="Tavsif" placeholderTextColor={colors.textDim}
              value={form.desc} onChangeText={(v) => setForm({ ...form, desc: v })}
              multiline style={[styles.input, { height: 90, textAlignVertical: "top" }]}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
              <Button title="Bekor" variant="ghost" onPress={() => setModal(false)} style={{ flex: 1 }} />
              <Button title="Qo'shish" onPress={add} loading={busy} style={{ flex: 1 }} />
            </View>
          </View>
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
  item: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.card },
  thumbEmpty: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  itemName: { fontSize: 16, fontWeight: "800", color: colors.text },
  itemPrice: { fontSize: 14, fontWeight: "700", color: colors.primary, marginTop: 2 },
  itemDesc: { fontSize: 13, color: colors.textDim, marginTop: 2 },
  sheetWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  sheetTitle: { fontSize: 20, fontWeight: "900", color: colors.text, marginBottom: 16 },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 14,
    height: 50, fontSize: 15, color: colors.text, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
});
