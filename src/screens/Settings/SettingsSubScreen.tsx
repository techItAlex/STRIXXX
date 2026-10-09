import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { BrandLogo } from "../../branding/Brand";
import { useColors } from "../../context/ThemeContext";
import { useStyles } from "../../theme/useStyles";
import type { Colors } from "../../theme/colors";

// Shared shell + building blocks for every screen pushed from Settings
// (About, How to Use, FAQ, Privacy Policy, Terms of Use). Keeping them on one
// set of themed primitives is what makes these feel like part of Settings
// rather than bolted-on legal pages — same back button, same logo, same
// card/title/subtitle rhythm, same palette in light and dark.

type SubChild = React.ReactNode;

export function SettingsSubScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: SubChild;
}) {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const styles = useStyles(makeStyles);
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Pressable style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <BrandLogo size="small" />
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={styles.stack}>{children}</View>
    </ScrollView>
  );
}

/** A titled card — the same surface Settings uses for its choice lists. */
export function InfoCard({ title, children }: { title?: string; children: SubChild }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.card}>
      {!!title && <Text style={styles.cardTitle}>{title}</Text>}
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}

export function Paragraph({ children }: { children: SubChild }) {
  const styles = useStyles(makeStyles);
  return <Text style={styles.paragraph}>{children}</Text>;
}

export function Bullets({ items }: { items: string[] }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={{ gap: 6 }}>
      {items.map((item, index) => (
        <View key={index} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

/** Numbered/lettered step used by How to Use and the FAQ-style lists. */
export function StepRow({
  badge,
  title,
  body,
}: {
  badge: string;
  title: string;
  body: string;
}) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{badge}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepBody}>{body}</Text>
      </View>
    </View>
  );
}

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.card}>
      <Text style={styles.faqQuestion}>{question}</Text>
      <Text style={styles.paragraph}>{answer}</Text>
    </View>
  );
}

/** Bolded callout line (used for the AI disclaimer inside Terms). */
export function Emphasis({ children }: { children: SubChild }) {
  const styles = useStyles(makeStyles);
  return <Text style={styles.emphasis}>{children}</Text>;
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 22, paddingTop: 44, gap: 16, paddingBottom: 60 },
  back: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontSize: 25, fontWeight: "800", marginTop: 4 },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  stack: { gap: 14, marginTop: 4 },
  card: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  paragraph: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  bulletRow: { flexDirection: "row", gap: 8 },
  bulletDot: { color: colors.accentText, fontSize: 13, lineHeight: 20 },
  bulletText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.iconWell,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: { color: colors.accentText, fontSize: 13, fontWeight: "800" },
  stepTitle: { color: colors.text, fontSize: 13, fontWeight: "700" },
  stepBody: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  faqQuestion: { color: colors.text, fontSize: 14, fontWeight: "700" },
  emphasis: {
    color: colors.accentOrange,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
});
