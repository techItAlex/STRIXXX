import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../context/ThemeContext";
import { useStyles } from "../theme/useStyles";
import type { Colors } from "../theme/colors";

/** Single source of truth for the AI disclaimer wording. */
export const AI_DISCLAIMER =
  "AI responses may be inaccurate — verify important information.";

/**
 * Small, visible disclaimer shown near every AI feature. Themed, so it reads
 * correctly in both light and dark mode.
 */
export function AiDisclaimer({
  style,
  compact,
}: {
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, style]}>
      <Ionicons name="alert-circle-outline" size={13} color={colors.accentOrange} />
      <Text style={styles.text}>{AI_DISCLAIMER}</Text>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.warnSurface,
    borderWidth: 1,
    borderColor: colors.warnBorder,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 20,
  },
  wrapCompact: { marginHorizontal: 0 },
  text: { flex: 1, color: colors.textMuted, fontSize: 11, lineHeight: 15 },
});
