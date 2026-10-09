import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { LEVEL_ORDER, NodeLevel, levelLabel } from "../../types";

const LEVEL_META: Record<NodeLevel, { icon: any; example: string }> = {
  field: { icon: "grid", example: "e.g. Tech, Food, Health..." },
  subject: { icon: "layers", example: "e.g. Machine Learning, Nutrition..." },
  topic: { icon: "pricetag", example: "e.g. Deep Learning, Cooking..." },
  lesson: { icon: "book", example: "e.g. Backpropagation, Recipe Basics..." },
  word: { icon: "text", example: "e.g. ReLU, Protein..." },
};

export default function QuickNoteInputScreen() {
  const navigation = useNavigation<any>();
  const [term, setTerm] = useState("");
  const [level, setLevel] = useState<NodeLevel>("word");

  return (
    <View style={styles.screen}>
      <Header title="Quick Note" subtitle="Add a term, idea, or concept." />

      <View style={styles.inputWrap}>
        <Ionicons name="text" size={16} color={colors.textFaint} />
        <TextInput
          value={term}
          onChangeText={setTerm}
          placeholder="neural network"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          autoFocus
        />
        {term.length > 0 && (
          <Pressable onPress={() => setTerm("")}>
            <Ionicons name="close-circle" size={18} color={colors.textFaint} />
          </Pressable>
        )}
      </View>

      <Text style={styles.sectionLabel}>Where do you want to place it?</Text>
      <View style={{ gap: 10 }}>
        {LEVEL_ORDER.map((l) => (
          <Pressable
            key={l}
            style={[styles.levelRow, level === l && styles.levelRowActive]}
            onPress={() => setLevel(l)}
          >
            <View style={styles.levelIcon}>
              <Ionicons name={LEVEL_META[l].icon} size={16} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.levelTitle}>{levelLabel(l)}</Text>
              <Text style={styles.levelExample}>{LEVEL_META[l].example}</Text>
            </View>
            <View
              style={[
                styles.radioOuter,
                level === l && { borderColor: colors.accentTeal },
              ]}
            >
              {level === l && <View style={styles.radioInner} />}
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.nextBtn, !term.trim() && { opacity: 0.5 }]}
        disabled={!term.trim()}
        onPress={() =>
          navigation.navigate("QuickNoteField", { term: term.trim(), level })
        }
      >
        <Text style={styles.nextBtnText}>Next</Text>
      </Pressable>
    </View>
  );
}

export function Header({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack ?? (() => navigation.goBack())}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <View style={{ marginLeft: 10 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: 44, paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  headerSubtitle: { color: colors.textMuted, fontSize: 12 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  input: { flex: 1, color: colors.text, fontSize: 14 },
  sectionLabel: { color: colors.text, fontWeight: "700", marginBottom: 10 },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelRowActive: { borderColor: colors.accentTeal },
  levelIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  levelTitle: { color: colors.text, fontWeight: "600", fontSize: 13 },
  levelExample: { color: colors.textFaint, fontSize: 11, marginTop: 1 },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.accentTeal,
  },
  nextBtn: {
    marginTop: 24,
    backgroundColor: colors.accentTeal,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  nextBtnText: { color: "#0B0F19", fontWeight: "700", fontSize: 14 },
});
