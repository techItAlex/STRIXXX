import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useColors } from "../context/ThemeContext";
import { useStyles } from "../theme/useStyles";
import type { Colors } from "../theme/colors";
import { useNodes } from "../context/NodeContext";
import { useProfile } from "../context/ProfileContext";
import { BrandLogo } from "../branding/Brand";

function hourGreeting(name: string) {
  const label = name || "Der";
  const h = new Date().getHours();
  if (h < 12) return [`Good Morning, ${label}`, "sunny"] as const;
  if (h < 18) return [`Good Afternoon, ${label}`, "partly-sunny"] as const;
  return [`Good Evening, ${label}`, "moon"] as const;
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { recentNodes, getPath } = useNodes();
  const { displayName } = useProfile();
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const [greeting, icon] = hourGreeting(displayName);
  const recent = recentNodes(3);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <BrandLogo size="small" />
          <Pressable style={styles.avatar} onPress={() => navigation.navigate("Settings")}>
            <Ionicons name="person" size={18} color={colors.text} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <Pressable onPress={() => navigation.navigate("Calendar")} style={{ padding: 14, borderRadius: 14, backgroundColor: colors.surface, marginBottom: 14 }}>
            <Text style={{ color: colors.text, fontWeight: "700" }}>Calendar and deadlines</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 3 }}>Plan projects, due dates, and reminders</Text>
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.greeting}>{greeting} </Text>
            <Ionicons name={icon as any} size={20} color={colors.accentOrange} />
          </View>
          <Text style={styles.subGreeting}>
            Small steps every day build a stronger you.
          </Text>
        </View>

        <SectionHeader title="Tools" onViewAll={() => {}} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        >
          <ToolCard
            title="My Notes"
            subtitle="Organize your knowledge tree."
            colorsGrad={["#8B5CF6", "#EC4899"]}
            icon="document-text"
            onPress={() => navigation.navigate("Tree")}
          />
          <ToolCard
            title="AI Companion"
            subtitle="Discuss, learn, get feedback."
            colorsGrad={["#3E8DFF", "#60A5FA"]}
            icon="chatbubbles"
            onPress={() => navigation.navigate("AI")}
          />
          <ToolCard
            title="Focus Timer"
            subtitle="Stay focused, get more done."
            colorsGrad={["#10B981", "#2FD9A8"]}
            icon="timer"
            onPress={() => {}}
            comingSoon
          />
        </ScrollView>

        <SectionHeader title="Quick Access" icon="flash" />
        <View style={styles.quickGrid}>
          <QuickTile
            title="Add Note"
            subtitle="Save what you learn"
            icon="create"
            bg={colors.accentPurple}
            onPress={() => navigation.navigate("QuickNoteInput")}
          />
          <QuickTile
            title="AI Suggest"
            subtitle="Find the right place for new terms"
            icon="sparkles"
            bg={colors.accentBlue}
            onPress={() => navigation.navigate("AiOrganize")}
          />
          <QuickTile
            title="Browse Tree"
            subtitle="Explore your knowledge"
            icon="git-network"
            bg={colors.accentTeal}
            onPress={() => navigation.navigate("Tree")}
          />
          <QuickTile
            title="Extra Tools"
            subtitle="Additional features"
            icon="apps"
            bg={colors.accentPurple}
            comingSoon
          />
        </View>

        <SectionHeader title="Recent Activity" icon="time" onViewAll={() => {}} />
        <View style={styles.recentList}>
          {recent.length === 0 && (
            <Text style={styles.emptyText}>
              Nothing yet — add your first note to see it here.
            </Text>
          )}
          {recent.map((n) => {
            const path = getPath(n.id);
            const crumb = path
              .slice(0, -1)
              .map((p) => p.title)
              .join(" > ");
            return (
              <Pressable key={n.id} style={styles.recentRow}>
                <View style={styles.recentIcon}>
                  <Ionicons name="book" size={16} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentTitle}>{n.title}</Text>
                  <Text style={styles.recentMeta}>
                    {crumb || "Top level"} • updated{" "}
                    {timeAgo(n.updatedAt)}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textFaint}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Quick Note button */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("QuickNoteInput")}
      >
        <LinearGradient
          colors={["#3E8DFF", "#2FD9A8"]}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={22} color="#0B0F19" />
          <Text style={styles.fabText}>Quick Note</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function SectionHeader({
  title,
  icon,
  onViewAll,
}: {
  title: string;
  icon?: any;
  onViewAll?: () => void;
}) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {icon && <Ionicons name={icon} size={16} color={colors.accentTeal} />}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {onViewAll && (
        <Pressable onPress={onViewAll}>
          <Text style={styles.viewAll}>View All ›</Text>
        </Pressable>
      )}
    </View>
  );
}

function ToolCard({
  title,
  subtitle,
  colorsGrad,
  icon,
  onPress,
  comingSoon,
}: {
  title: string;
  subtitle: string;
  colorsGrad: [string, string];
  icon: any;
  onPress: () => void;
  comingSoon?: boolean;
}) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable onPress={onPress} style={{ width: 150 }}>
      <LinearGradient
        colors={colorsGrad}
        style={styles.toolCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.toolIconWrap}>
          <Ionicons name={icon} size={20} color="#fff" />
        </View>
        <Text style={styles.toolTitle}>{title}</Text>
        <Text style={styles.toolSubtitle}>{subtitle}</Text>
        <Ionicons
          name="arrow-forward"
          size={16}
          color="rgba(255,255,255,0.85)"
        />
        {comingSoon && (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

function QuickTile({
  title,
  subtitle,
  icon,
  bg,
  onPress,
  comingSoon,
}: {
  title: string;
  subtitle: string;
  icon: any;
  bg: string;
  onPress?: () => void;
  comingSoon?: boolean;
}) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      style={styles.quickTile}
      onPress={comingSoon ? undefined : onPress}
    >
      <View style={[styles.quickIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={16} color={colors.onAccent} />
      </View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSubtitle}>{subtitle}</Text>
      {comingSoon && <Text style={styles.comingSoonInline}>Coming soon</Text>}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 12,
  },
  appName: { color: colors.text, fontSize: 20, fontWeight: "700" },
  tagline: { color: colors.textMuted, fontSize: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: { color: colors.text, fontSize: 24, fontWeight: "700" },
  subGreeting: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  viewAll: { color: colors.textMuted, fontSize: 12 },
  toolCard: {
    borderRadius: 18,
    padding: 14,
    height: 140,
    justifyContent: "space-between",
  },
  toolIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolTitle: { color: "#fff", fontWeight: "700", fontSize: 14 },
  toolSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 11 },
  comingSoonBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  comingSoonText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  quickTile: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickTitle: { color: colors.text, fontWeight: "700", fontSize: 13 },
  quickSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  comingSoonInline: {
    color: colors.accentOrange,
    fontSize: 10,
    marginTop: 6,
    fontWeight: "600",
  },
  recentList: { paddingHorizontal: 20, gap: 10 },
  emptyText: { color: colors.textFaint, fontSize: 13 },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  recentTitle: { color: colors.text, fontWeight: "600", fontSize: 13 },
  recentMeta: { color: colors.textFaint, fontSize: 11, marginTop: 2 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  fabText: { color: "#0B0F19", fontWeight: "700", fontSize: 13 },
});
