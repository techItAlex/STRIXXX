import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useNodes } from "../context/NodeContext";
import { colors } from "../theme/colors";
import { useStudy } from "../context/StudyContext";
import { StrixNode } from "../types";

export default function NodeDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { getNode, getPath, getChildren, updateNode } = useNodes();
  const { sessionsForTopic } = useStudy();
  const node = getNode(route.params?.nodeId);

  // Edit mode: the name and the description can both be rewritten freely.
  // Hooks live before the early return below so the hook order stays stable.
  // Opening with { edit: true } (Tree long-press → Edit) lands straight in it.
  const [editing, setEditing] = useState(route.params?.edit === true);
  const [draftTitle, setDraftTitle] = useState(node?.title ?? "");
  const [draftBody, setDraftBody] = useState(node?.content?.value ?? "");

  if (!node) return <View style={styles.screen}><Text style={styles.missing}>This item is no longer available.</Text></View>;
  const path = getPath(node.id);
  const children = getChildren(node.id);
  const body = node.content?.value;
  const isTextContent = !node.content || node.content.kind === "text";
  const studySessions = sessionsForTopic(node.id);
  const focusedSeconds = studySessions.reduce((total, session) => total + session.focusedSeconds, 0);
  const completedSessions = studySessions.filter((session) => session.completed && session.focusedSeconds > 0).length;

  const startEdit = () => {
    setDraftTitle(node.title);
    setDraftBody(node.content?.value ?? "");
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);
  const saveEdit = () => {
    const patch: Partial<StrixNode> = {};
    const newTitle = draftTitle.trim();
    if (newTitle && newTitle !== node.title) patch.title = newTitle;
    if (isTextContent) {
      const newBody = draftBody.trim();
      if (newBody !== (node.content?.value ?? "")) {
        patch.content = newBody ? { kind: "text", value: newBody } : undefined;
      }
    }
    if (Object.keys(patch).length > 0) updateNode(node.id, patch);
    setEditing(false);
  };

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="chevron-back" size={22} color={colors.text} /></Pressable>
    <Text style={styles.breadcrumb}>{path.slice(0, -1).map((part) => part.title).join("  ›  ") || "Knowledge tree"}</Text>
    <View style={styles.titleRow}>
      <View style={styles.icon}><Ionicons name={(node.icon || "document-text") as any} size={22} color={colors.accentTeal} /></View>
      <View style={{ flex: 1 }}>
        {editing
          ? <TextInput value={draftTitle} onChangeText={setDraftTitle} style={styles.titleInput} placeholder="Name" placeholderTextColor={colors.textFaint} autoFocus />
          : <Text style={styles.title} selectable>{node.title}</Text>}
        <Text style={styles.level}>{node.level === "word" ? "Note" : node.level}</Text>
      </View>
      {editing ? (
        <Pressable style={styles.iconBtn} onPress={cancelEdit}><Ionicons name="close" size={18} color={colors.textMuted} /></Pressable>
      ) : (
        <>
          <Pressable style={styles.iconBtn} onPress={() => navigation.navigate("AiChat", { mode: "discuss", contextNodeId: node.id })}><Ionicons name="sparkles" size={16} color={colors.accentTeal} /></Pressable>
          <Pressable style={styles.iconBtn} onPress={startEdit}><Ionicons name="pencil" size={16} color={colors.accentTeal} /></Pressable>
        </>
      )}
    </View>
    {editing ? (
      <View style={styles.card}>
        <Text style={styles.cardLabel}>DESCRIPTION / NOTES</Text>
        <TextInput value={draftBody} onChangeText={setDraftBody} style={styles.bodyInput} placeholder="Write your description, definition, or notes..." placeholderTextColor={colors.textFaint} multiline autoFocus={false} maxLength={2000} textAlignVertical="top" />
        <Text style={styles.counter}>{draftBody.length}/2000</Text>
        <Pressable style={[styles.saveBtn, !draftTitle.trim() && { opacity: 0.5 }]} disabled={!draftTitle.trim()} onPress={saveEdit}>
          <Text style={styles.saveBtnText}>Save changes</Text>
        </Pressable>
      </View>
    ) : body ? <View style={styles.card}><Text style={styles.cardLabel}>NOTES</Text><Text style={styles.body} selectable>{body}</Text></View> : <View style={styles.card}><Text style={styles.cardLabel}>CONTENT</Text><Text style={styles.empty}>No content has been added yet.</Text></View>}
    <View style={styles.card}><Text style={styles.cardLabel}>STUDY HISTORY</Text><Text style={styles.studyValue}>{formatStudyTime(focusedSeconds)} focused</Text><Text style={styles.empty}>{completedSessions} completed session{completedSessions === 1 ? "" : "s"}{studySessions[0] ? ` • last studied ${new Date(studySessions[0].startedAt).toLocaleDateString()}` : " • not studied yet"}</Text></View>
    {children.length > 0 && <View style={styles.card}><Text style={styles.cardLabel}>CONTAINS</Text>{children.map((child) => <Pressable key={child.id} style={styles.child} onPress={() => navigation.push("NodeDetail", { nodeId: child.id })}><Ionicons name={(child.icon || "document-text") as any} size={16} color={colors.accentTeal} /><Text style={styles.childText}>{child.title}</Text><Ionicons name="chevron-forward" size={16} color={colors.textFaint} /></Pressable>)}</View>}
  </ScrollView>;
}

function formatStudyTime(seconds: number) {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.round(seconds % 3600 / 60)}m`;
  return `${Math.round(seconds / 60)}m`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingTop: 42, gap: 18 }, back: { width: 36, height: 36, justifyContent: "center" }, breadcrumb: { color: colors.accentBlue, fontSize: 12 }, titleRow: { flexDirection: "row", alignItems: "center", gap: 12 }, icon: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#123B39", alignItems: "center", justifyContent: "center" }, iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#123B39", alignItems: "center", justifyContent: "center" }, title: { color: colors.text, fontWeight: "700", fontSize: 22 }, titleInput: { color: colors.text, fontWeight: "700", fontSize: 22, borderBottomWidth: 1, borderBottomColor: colors.accentTeal, paddingVertical: 2 }, level: { color: colors.textMuted, fontSize: 12, marginTop: 3, textTransform: "capitalize" }, card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border }, cardLabel: { color: colors.textFaint, fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 10 }, body: { color: colors.text, fontSize: 14, lineHeight: 22 }, bodyInput: { color: colors.text, fontSize: 14, lineHeight: 22, minHeight: 140, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, textAlignVertical: "top" }, counter: { color: colors.textFaint, fontSize: 11, textAlign: "right", marginTop: 6 }, saveBtn: { marginTop: 12, backgroundColor: colors.accentTeal, borderRadius: 12, paddingVertical: 13, alignItems: "center" }, saveBtnText: { color: "#0B0F19", fontWeight: "700", fontSize: 14 }, empty: { color: colors.textMuted, fontSize: 13 }, studyValue: { color: colors.accentTeal, fontSize: 21, fontWeight: "800", marginBottom: 4 }, missing: { color: colors.textMuted, textAlign: "center", marginTop: 80 }, child: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border }, childText: { flex: 1, color: colors.text, fontSize: 14 },
});
