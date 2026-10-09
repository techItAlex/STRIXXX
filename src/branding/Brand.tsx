import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "../context/ThemeContext";
import { useStyles } from "../theme/useStyles";
import type { Colors } from "../theme/colors";

export type BrandIconName = "home" | "tree" | "ai" | "timer" | "create" | "search" | "settings" | "notifications" | "profile" | "document" | "image" | "audio" | "video" | "link" | "note" | "favorite" | "bookmark" | "delete" | "edit" | "share" | "more" | "info" | "help" | "shield" | "book" | "chevron";
export type CompanionState = "idle" | "happy" | "thinking" | "excited" | "sleeping" | "loading" | "success" | "error";

const iconMap: Record<BrandIconName, any> = {
  home: "home", tree: "git-network", ai: "sparkles", timer: "timer", create: "add", search: "search", settings: "settings", notifications: "notifications-outline", profile: "person", document: "document-text-outline", image: "image-outline", audio: "musical-notes-outline", video: "play", link: "link", note: "create-outline", favorite: "star-outline", bookmark: "bookmark-outline", delete: "trash-outline", edit: "pencil", share: "share-social-outline", more: "ellipsis-horizontal", info: "information-circle-outline", help: "help-circle-outline", shield: "shield-checkmark-outline", book: "book-outline", chevron: "chevron-forward",
};

export const knowledgeIcons: Record<string, { icon: any; color: string }> = {
  technology: { icon: "grid", color: "#3B82F6" }, tech: { icon: "grid", color: "#3B82F6" }, programming: { icon: "code-slash", color: "#8B5CF6" }, networking: { icon: "git-network", color: "#20E4BA" }, science: { icon: "flask", color: "#F5C542" }, arts: { icon: "color-palette", color: "#EC6AC7" }, general: { icon: "book-outline", color: "#A78BFA" },
};

export function BrandIcon({ name, size = 22, active = false, boxed = false }: { name: BrandIconName; size?: number; active?: boolean; boxed?: boolean }) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const color = active ? colors.accentText : colors.secondaryBlue;
  const icon = <Ionicons name={iconMap[name]} size={size} color={color} />;
  if (!boxed) return icon;
  return <LinearGradient colors={[colors.surfaceAlt, colors.background]} style={[styles.iconBox, active && styles.iconBoxActive]}>{icon}</LinearGradient>;
}

export function KnowledgeIcon({ title, size = 22 }: { title: string; size?: number }) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const token = knowledgeIcons[title.trim().toLowerCase()] ?? { icon: "leaf", color: colors.primaryTeal };
  return <LinearGradient colors={[`${token.color}CC`, "#0A2C52"]} style={[styles.knowledgeIcon, { width: size + 18, height: size + 18, borderRadius: (size + 18) / 3 }]}><Ionicons name={token.icon} size={size} color="#EAF8FF" /></LinearGradient>;
}

export function BrandMark({ size = 44, compact = false }: { size?: number; compact?: boolean }) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  return <View style={[styles.mark, { width: size, height: size }]}>
    <Ionicons name="leaf" size={Math.round(size * 0.72)} color={colors.accentText} style={[styles.markLeaf, { left: -2, bottom: 1, transform: [{ rotate: "-40deg" }] }]} />
    <Ionicons name="leaf" size={Math.round(size * 0.72)} color="#44D9FF" style={[styles.markLeaf, { right: -2, bottom: 1, transform: [{ rotate: "40deg" }] }]} />
    {!compact && <Ionicons name="sparkles" size={Math.round(size * 0.31)} color={colors.accentText} style={styles.markSpark} />}
  </View>;
}

export function BrandLogo({ compact = false, size = "regular" }: { compact?: boolean; size?: "small" | "regular" }) {
  const styles = useStyles(makeStyles);
  const markSize = size === "small" ? 27 : 38;
  return <View style={styles.logo}><BrandMark size={markSize} compact={compact} />{!compact && <View><Text style={[styles.logoName, size === "small" && { fontSize: 18 }]}>STRIX</Text>{size === "regular" && <Text style={styles.logoTagline}>Build what you know.</Text>}</View>}</View>;
}

export function AiCompanion({ state = "idle", size = 72 }: { state?: CompanionState; size?: number }) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const face = state === "sleeping" ? "⌣  ⌣" : state === "thinking" ? "•  •" : state === "excited" ? "^  ^" : state === "error" ? "×  ×" : "⌒  ⌒";
  const mood = state === "error" ? "#EF6A8A" : state === "success" || state === "happy" || state === "excited" ? colors.primaryTeal : "#4CC9FF";
  return <View style={[styles.botWrap, { width: size, height: size * 1.06 }]}>
    <View style={[styles.botAntenna, { backgroundColor: mood }]}><BrandMark size={Math.round(size * 0.35)} compact /></View>
    <LinearGradient colors={["#589BFF", "#1C3B92", "#0A1C41"]} style={[styles.botHead, { width: size, height: size * 0.7, borderRadius: size * 0.34 }]}>
      <View style={styles.botFace}><Text style={[styles.botEyes, { color: mood, fontSize: Math.round(size * 0.2) }]}>{face}</Text><Text style={[styles.botSmile, { color: mood, fontSize: Math.round(size * 0.17) }]}>{state === "thinking" ? "?" : state === "sleeping" ? "z" : "⌣"}</Text></View>
    </LinearGradient>
    <View style={[styles.botBody, { width: size * 0.42, height: size * 0.28, borderRadius: size * 0.17 }]}><BrandMark size={Math.round(size * 0.22)} compact /></View>
  </View>;
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderStrong }, iconBoxActive: { borderColor: colors.accentTeal, backgroundColor: colors.iconWell }, knowledgeIcon: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1A6A9C" }, mark: { alignItems: "center", justifyContent: "flex-end" }, markLeaf: { position: "absolute" }, markSpark: { position: "absolute", top: -3, alignSelf: "center" }, logo: { flexDirection: "row", alignItems: "center", gap: 8 }, logoName: { color: colors.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 }, logoTagline: { color: colors.textMuted, fontSize: 10, marginTop: -1 }, botWrap: { alignItems: "center", justifyContent: "flex-end" }, botAntenna: { position: "absolute", top: 0, width: 3, height: 16, borderRadius: 3, zIndex: 2 }, botHead: { alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#76D9FF", zIndex: 1 }, botFace: { width: "80%", height: "64%", borderRadius: 30, backgroundColor: "#05162F", alignItems: "center", justifyContent: "center" }, botEyes: { fontWeight: "900", letterSpacing: 3, lineHeight: 20 }, botSmile: { fontWeight: "700", marginTop: -3 }, botBody: { marginTop: -2, backgroundColor: "#1A3E93", borderWidth: 1, borderColor: "#5AD5FF", alignItems: "center", justifyContent: "center" },
});
