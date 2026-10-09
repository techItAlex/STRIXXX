import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "../../theme/colors";

export default function QuickNoteSuccessScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { term, parentTitle } = route.params;

  return (
    <View style={styles.screen}>
      <View style={styles.checkCircle}>
        <Ionicons name="checkmark" size={36} color="#0B0F19" />
      </View>
      <Text style={styles.title}>Note Added!</Text>
      <Text style={styles.subtitle}>
        "{term}" has been saved under {parentTitle}.
      </Text>

      <View style={styles.card}>
        <Ionicons name="chatbubble" size={16} color={colors.accentBlue} />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.cardTitle}>{term}</Text>
          <Text style={styles.cardMeta}>Field: {parentTitle}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, styles.secondaryBtn]}
          onPress={() =>
            navigation.navigate("MainTabs", { screen: "Tree" })
          }
        >
          <Text style={styles.secondaryBtnText}>View Note</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.primaryBtn]}
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: "QuickNoteInput" }],
            })
          }
        >
          <Text style={styles.primaryBtnText}>Add Another</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
      >
        <Text style={styles.doneLink}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 24,
  },
  checkCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "700" },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 30,
  },
  cardTitle: { color: colors.text, fontWeight: "700", fontSize: 14 },
  cardMeta: { color: colors.textFaint, fontSize: 11, marginTop: 2 },
  actions: { flexDirection: "row", gap: 12, width: "100%" },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.text, fontWeight: "700", fontSize: 13 },
  primaryBtn: { backgroundColor: colors.accentTeal },
  primaryBtnText: { color: "#0B0F19", fontWeight: "700", fontSize: 13 },
  doneLink: { color: colors.textMuted, marginTop: 22, fontSize: 13 },
});
