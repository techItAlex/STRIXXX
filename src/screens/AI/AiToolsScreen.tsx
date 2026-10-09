import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useColors } from "../../context/ThemeContext";
import { useStyles } from "../../theme/useStyles";
import type { Colors } from "../../theme/colors";
import { useAiConversations, ConversationMode } from "../../context/AiConversationContext";

const MODE_ROUTE: Record<ConversationMode, { route: string; params?: any }> = {
  discuss: { route: "AiChat", params: { mode: "discuss" } },
  judge: { route: "JudgeUnderstanding" },
  organize: { route: "AiOrganize" },
};

export default function AiToolsScreen() {
  const navigation = useNavigation<any>();
  const { recentConversations } = useAiConversations();
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const recent = recentConversations(6);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={16} color={colors.onAccent} />
        </View>
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.headerTitle}>AI Companion</Text>
          <Text style={styles.headerSubtitle}>Tools & Shortcuts</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsList}>
          <ActionRow
            icon="chatbubble"
            color={colors.accentBlue}
            title="New Chat"
            subtitle="Start a fresh conversation"
            onPress={() => navigation.navigate("AiChat", { mode: "discuss" })}
          />
          <ActionRow
            icon="mic"
            color={colors.accentPurple}
            title="Voice Input"
            subtitle="Speak instead of typing"
            comingSoon
          />
          <ActionRow
            icon="image"
            color={colors.accentText}
            title="Image Analysis"
            subtitle="Analyze images or diagrams"
            comingSoon
          />
          <ActionRow
            icon="document-text"
            color={colors.accentPink}
            title="Use a Template"
            subtitle="Try a pre-built prompt"
            comingSoon
          />
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Chats</Text>
          <Text style={styles.viewAll}>View All ›</Text>
        </View>
        <View style={{ gap: 10 }}>
          {recent.length === 0 && (
            <Text style={styles.emptyText}>
              No AI conversations yet — start one above.
            </Text>
          )}
          {recent.map((c) => (
            <Pressable
              key={c.id}
              style={styles.recentRow}
              onPress={() =>
                navigation.navigate(MODE_ROUTE[c.mode].route, {
                  ...(MODE_ROUTE[c.mode].params ?? {}),
                  conversationId: c.id,
                })
              }
            >
              <View style={styles.recentIcon}>
                <Ionicons name="chatbubble" size={14} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentTitle}>{c.title}</Text>
                <Text style={styles.recentMeta}>{timeAgo(c.updatedAt)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ActionRow({
  icon,
  color,
  title,
  subtitle,
  onPress,
  comingSoon,
}: {
  icon: any;
  color: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  comingSoon?: boolean;
}) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      style={styles.actionRow}
      onPress={comingSoon ? undefined : onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={16} color={colors.onAccent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>
          {comingSoon ? "Coming soon" : subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

function timeAgo(ts: number) {
  const diffMin = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.round(diffH / 24)}d ago`;
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 44,
    gap: 10,
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.accentBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  headerSubtitle: { color: colors.textMuted, fontSize: 11 },
  sectionTitle: { color: colors.text, fontWeight: "700", fontSize: 14, marginBottom: 12 },
  actionsList: { gap: 10, marginBottom: 28 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { color: colors.text, fontWeight: "600", fontSize: 13 },
  actionSubtitle: { color: colors.textFaint, fontSize: 11, marginTop: 1 },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAll: { color: colors.textMuted, fontSize: 12 },
  emptyText: { color: colors.textFaint, fontSize: 13 },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  recentTitle: { color: colors.text, fontWeight: "600", fontSize: 13 },
  recentMeta: { color: colors.textFaint, fontSize: 11, marginTop: 2 },
});
