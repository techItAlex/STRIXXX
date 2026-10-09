import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function ComingSoonScreen({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: any;
}) {
  return (
    <View style={styles.screen}>
      <Ionicons name={icon} size={40} color={colors.textFaint} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Text style={styles.note}>
        Held for a follow-up build, per the current plan.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 30,
  },
  title: { color: colors.text, fontSize: 17, fontWeight: "700", marginTop: 8 },
  subtitle: { color: colors.textMuted, fontSize: 13, textAlign: "center" },
  note: { color: colors.textFaint, fontSize: 11, marginTop: 10 },
});
