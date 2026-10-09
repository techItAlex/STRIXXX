import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useColors } from "../../context/ThemeContext";
import { useStyles } from "../../theme/useStyles";
import type { Colors } from "../../theme/colors";
import { useApiKey } from "../../context/ApiKeyContext";
import { AiCompanion, BrandLogo } from "../../branding/Brand";
import { AiDisclaimer } from "../../components/AiDisclaimer";
import { setAiMode, useAiRuntime } from "../../services/ai/aiRuntime";

export default function AiHomeScreen() {
  const navigation = useNavigation<any>();
  const { hasKey } = useApiKey();
  const runtime = useAiRuntime();
  const colors = useColors();
  const styles = useStyles(makeStyles);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <BrandLogo size="small" />
          <Pressable onPress={() => navigation.navigate("AiTools")}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <AiCompanion state="idle" size={40} />
            <Text style={styles.heroTitle}>AI Companion</Text>
          </View>
          <Text style={styles.heroSubtitle}>
            Ask, learn, and grow — with your personal AI assistant.
          </Text>
        </View>


        <View style={{ paddingHorizontal: 20, gap: 12, marginTop: 8 }}>
          <ActionCard
            icon="chatbubbles"
            gradient={["#3E8DFF", "#8B5CF6"]}
            title="Discuss my notes"
            subtitle="Ask questions about your saved notes and get clear, helpful explanations."
            onPress={() => navigation.navigate("AiChat", { mode: "discuss" })}
          />
          <ActionCard
            icon="bulb"
            gradient={["#10B981", "#2FD9A8"]}
            title="Judge my understanding"
            subtitle="Submit a word and your own definition. Get feedback on accuracy and completeness."
            onPress={() => navigation.navigate("JudgeUnderstanding")}
          />
          <ActionCard
            icon="sparkles"
            gradient={["#F59E0B", "#EC4899"]}
            title="AI Organization"
            subtitle="Let AI suggest where to place your new terms in your knowledge tree."
            onPress={() => navigation.navigate("AiOrganize")}
          />
          <Pressable
            style={styles.keyRow}
            onPress={() => navigation.navigate("ApiKey")}
          >
            <Ionicons name="key" size={16} color={colors.accentText} />
            <Text style={styles.keyRowText}>
              {hasKey ? "Optional cloud (Gemini) settings" : "Optional cloud (Gemini)"}
            </Text>
            <Text style={styles.keyRowSub}>
              {hasKey ? "" : "Local AI works without a key."}
            </Text>
          </Pressable>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["local", "cloud"] as const).map((mode) => (
              <Pressable key={mode} onPress={() => setAiMode(mode)} style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: runtime.mode === mode ? colors.accentTeal : colors.surface }}>
                <Text style={{ color: runtime.mode === mode ? "#0B0F19" : colors.text, textAlign: "center", fontWeight: "700" }}>{mode === "local" ? "On-device" : "Cloud (Gemini)"}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => navigation.navigate("LocalSmokeTest")} style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surface }}>
            <Text style={{ color: colors.text, fontWeight: "700" }}>Local model smoke test (development)</Text>
          </Pressable>

          <AiDisclaimer compact />
        </View>
      </ScrollView>
    </View>
  );
}

function ActionCard({
  icon,
  gradient,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  gradient: [string, string];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={gradient}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardIconWrap}>
          <Ionicons name={icon} size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.85)" />
      </LinearGradient>
    </Pressable>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 44,
  },
  appName: { color: colors.text, fontSize: 18, fontWeight: "700" },
  tagline: { color: colors.textMuted, fontSize: 11 },
  hero: { paddingHorizontal: 20, marginTop: 22, marginBottom: 18 },
  heroTitle: { color: colors.text, fontSize: 24, fontWeight: "800" },
  heroSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
  warnCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.warnSurface,
    borderWidth: 1,
    borderColor: colors.warnBorder,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  warnText: { flex: 1, color: colors.accentOrange, fontSize: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    padding: 16,
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cardSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 3 },
  keyRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  keyRowText: { color: colors.text, fontWeight: "700", fontSize: 13 },
  keyRowSub: { color: colors.textFaint, fontSize: 11 },
});
