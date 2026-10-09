import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { useNodes } from "../../context/NodeContext";
import { useApiKey } from "../../context/ApiKeyContext";
import { generateDefinition } from "../../services/ai/aiService";
import { isAiAvailable } from "../../services/ai/aiRuntime";
import { AiDisclaimer } from "../../components/AiDisclaimer";
import { Header } from "./QuickNoteInputScreen";
import { ContentKind } from "../../types";

const TABS: { key: ContentKind; label: string; icon: any }[] = [
  { key: "text", label: "Text", icon: "document-text" },
  { key: "image", label: "Image", icon: "image" },
  { key: "audio", label: "Audio", icon: "mic" },
];

export default function QuickNoteContentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { term, level, parentId } = route.params;
  const { addNode, getNode, getPath } = useNodes();
  const { apiKey } = useApiKey();
  const parent = getNode(parentId);

  const [tab, setTab] = useState<ContentKind>("text");
  const [text, setText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // The AI writes the definition with this exact location in mind — the path
  // (Field › Subject › Lesson) plus any notes already in the parent lesson,
  // so a spelling that changes meaning by subject comes out right.
  const handleAiDefinition = async () => {
    if (aiLoading || !term.trim()) return;
    if (!isAiAvailable(apiKey)) {
      Alert.alert(
        "Optional cloud key needed",
        "Cloud mode requires a Gemini key. Switch back to local mode or add a key in AI settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Cloud settings", onPress: () => navigation.navigate("ApiKey") },
        ]
      );
      return;
    }
    const write = async () => {
      setAiLoading(true);
      try {
        const definition = await generateDefinition({
          apiKey,
          term: term.trim(),
          parentPath: getPath(parentId),
          parentNote: parent?.description || parent?.content?.value,
        });
        setText(definition);
      } catch (err: any) {
        Alert.alert("Couldn't generate definition", err?.message || "Try again in a moment.");
      } finally {
        setAiLoading(false);
      }
    };
    if (text.trim()) {
      Alert.alert("Replace your text?", "The AI definition will overwrite what you've written in the box.", [
        { text: "Keep mine", style: "cancel" },
        { text: "Replace", onPress: write },
      ]);
    } else {
      await write();
    }
  };

  const handleSave = () => {
    const node = addNode({
      parentId,
      level,
      title: term,
      content:
        tab === "text" && text.trim()
          ? { kind: "text", value: text.trim() }
          : tab !== "text"
          ? { kind: tab, value: "" } // media capture wired up in a follow-up
          : undefined,
    });
    navigation.navigate("QuickNoteSuccess", {
      nodeId: node.id,
      term,
      parentTitle: parent?.title ?? "",
    });
  };

  return (
    <View style={styles.screen}>
      <Header title="Add Content" />

      <View style={styles.fieldPill}>
        <Ionicons name="folder" size={14} color={colors.textMuted} />
        <Text style={styles.fieldPillLabel}>Under</Text>
        <Text style={styles.fieldPillValue} numberOfLines={1}>
          {getPath(parentId).map((p) => p.title).join(" › ") || "—"}
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Add your note content</Text>
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "text" ? (
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write your notes, definition, or understanding here..."
          placeholderTextColor={colors.textFaint}
          style={styles.textArea}
          multiline
          maxLength={2000}
        />
      ) : (
        <View style={styles.mediaStub}>
          <Ionicons
            name={tab === "image" ? "image-outline" : "mic-outline"}
            size={32}
            color={colors.textFaint}
          />
          <Text style={styles.mediaStubText}>
            {tab === "image" ? "Tap to upload an image" : "Tap to record audio"}
          </Text>
          <Text style={styles.mediaStubNote}>
            Capture isn't wired up yet in this initial build — see README.
          </Text>
        </View>
      )}

      {tab === "text" && (
        <Text style={styles.counter}>{text.length}/2000</Text>
      )}

      {tab === "text" && (
        <>
          <Pressable
            style={[styles.aiBtn, aiLoading && { opacity: 0.6 }]}
            disabled={aiLoading}
            onPress={handleAiDefinition}
          >
            {aiLoading ? (
              <ActivityIndicator size="small" color={colors.accentTeal} />
            ) : (
              <Ionicons name="sparkles" size={16} color={colors.accentTeal} />
            )}
            <Text style={styles.aiBtnText}>
              {aiLoading ? "Writing definition…" : "Generate AI Definition"}
            </Text>
          </Pressable>
          <AiDisclaimer compact />
        </>
      )}

      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: 44, paddingHorizontal: 20 },
  fieldPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  fieldPillLabel: { color: colors.textMuted, fontSize: 12 },
  fieldPillValue: { color: colors.text, fontWeight: "600", fontSize: 13 },
  sectionLabel: { color: colors.text, fontWeight: "700", marginBottom: 10 },
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: colors.accentTeal },
  tabText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#0B0F19" },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    color: colors.text,
    fontSize: 13,
    minHeight: 140,
    textAlignVertical: "top",
  },
  counter: { color: colors.textFaint, fontSize: 11, textAlign: "right", marginTop: 6 },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentTeal,
    paddingVertical: 13,
  },
  aiBtnText: { color: colors.accentTeal, fontWeight: "700", fontSize: 13 },
  mediaStub: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 20,
  },
  mediaStubText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  mediaStubNote: { color: colors.textFaint, fontSize: 11, textAlign: "center" },
  saveBtn: {
    marginTop: 24,
    backgroundColor: colors.accentTeal,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveBtnText: { color: "#0B0F19", fontWeight: "700", fontSize: 14 },
});
