import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useColors } from "../../context/ThemeContext";
import { useStyles } from "../../theme/useStyles";
import type { Colors } from "../../theme/colors";
import { useNodes } from "../../context/NodeContext";
import { useApiKey } from "../../context/ApiKeyContext";
import { useAiConversations } from "../../context/AiConversationContext";
import { suggestPlacement } from "../../services/ai/aiService";
import { AiServiceError, PlacementResult, PlacementSuggestion } from "../../services/ai/types";
import { AiDisclaimer } from "../../components/AiDisclaimer";

type Stage = "input" | "suggestions" | "createSubject" | "created";

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export default function AiOrganizeScreen() {
  const navigation = useNavigation<any>();
  const { apiKey } = useApiKey();
  const { nodes, getChildren, getPath, addNode } = useNodes();
  const { createConversation, appendMessages } = useAiConversations();

  const [term, setTerm] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // New-subject sub-flow state
  const [subjectName, setSubjectName] = useState("");
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const fields = getChildren(null);
  const colors = useColors();
  const styles = useStyles(makeStyles);

  const handleGetSuggestions = async () => {
    if (!term.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await suggestPlacement({ apiKey, term: term.trim(), nodes, getPath });
      setResult(res);
      setSelectedId(res.suggestions[0]?.subjectNodeId ?? null);
      setStage("suggestions");
    } catch (e) {
      setError(
        e instanceof AiServiceError ? e.message : "Couldn't get a suggestion — try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const logOrganizeConversation = (summary: string) => {
    const convo = createConversation("organize", `${term.trim()} – Notes Organization`);
    appendMessages(convo.id, [
      { id: "u1", role: "user", text: `New term: ${term.trim()}`, createdAt: Date.now() },
      { id: "a1", role: "assistant", text: summary, createdAt: Date.now() },
    ]);
  };

  const handleAddToSelected = () => {
    if (!selectedId) return;
    const subject = nodes.find((n) => n.id === selectedId);
    if (!subject) return;
    addNode({ parentId: selectedId, level: "word", title: term.trim() });
    logOrganizeConversation(`Added "${term.trim()}" under ${subject.title}.`);
    navigation.navigate("NodeDetail", { nodeId: selectedId });
  };

  const startCreateSubject = () => {
    setSubjectName(result?.proposedSubjectName ?? term.trim());
    const proposedField = fields.find(
      (f) => f.title.toLowerCase() === (result?.proposedFieldTitle ?? "").toLowerCase()
    );
    setSelectedFieldId(proposedField?.id ?? fields[0]?.id ?? null);
    setStage("createSubject");
  };

  const handleCreateSubject = () => {
    if (!subjectName.trim() || !selectedFieldId) return;
    const newSubject = addNode({
      parentId: selectedFieldId,
      level: "subject",
      title: subjectName.trim(),
    });
    addNode({ parentId: newSubject.id, level: "word", title: term.trim() });
    logOrganizeConversation(
      `Created new subject "${subjectName.trim()}" and added "${term.trim()}" to it.`
    );
    setStage("created");
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            stage === "input" ? navigation.goBack() : setStage("input")
          }
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={16} color={colors.onAccent} />
        </View>
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.headerTitle}>AI Organization</Text>
          <Text style={styles.headerSubtitle}>
            {stage === "createSubject" || stage === "created"
              ? "Create new items with AI"
              : "Get smart suggestions for your notes"}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {stage === "input" && (
          <>
            <Text style={styles.label}>You're adding a new term</Text>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color={colors.textFaint} />
              <TextInput
                value={term}
                onChangeText={setTerm}
                placeholder="e.g. rip current"
                placeholderTextColor={colors.textFaint}
                style={styles.searchInput}
                autoFocus
              />
              {term.length > 0 && (
                <Pressable onPress={() => setTerm("")}>
                  <Ionicons name="close-circle" size={18} color={colors.textFaint} />
                </Pressable>
              )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Pressable
              style={[styles.primaryBtn, !term.trim() && { opacity: 0.5 }]}
              disabled={!term.trim() || loading}
              onPress={handleGetSuggestions}
            >
              {loading ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <Text style={styles.primaryBtnText}>Get AI Suggestions</Text>
              )}
            </Pressable>
          </>
        )}

        {stage === "suggestions" && result && (
          <>
            <Text style={styles.label}>You're adding a new term</Text>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color={colors.textFaint} />
              <Text style={styles.searchStatic}>{term}</Text>
              <Pressable onPress={() => setStage("input")}>
                <Ionicons name="close-circle" size={18} color={colors.textFaint} />
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>AI Suggestions</Text>
            <Text style={styles.sectionHint}>
              Based on your existing tree, here's where this term might belong:
            </Text>

            <View style={{ gap: 10, marginTop: 12 }}>
              {result.suggestions.map((s: PlacementSuggestion) => (
                <Pressable
                  key={s.subjectNodeId}
                  style={[
                    styles.suggestionRow,
                    selectedId === s.subjectNodeId && styles.suggestionRowActive,
                  ]}
                  onPress={() => setSelectedId(s.subjectNodeId)}
                >
                  <View style={styles.suggestionIcon}>
                    <Ionicons name="layers" size={16} color={colors.onAccent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionTitle}>{s.subjectTitle}</Text>
                    <Text style={styles.suggestionMeta}>Subject</Text>
                    <Text style={styles.suggestionConfidence}>
                      {CONFIDENCE_LABEL[s.confidence]}
                    </Text>
                  </View>
                  {selectedId === s.subjectNodeId && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.accentText} />
                  )}
                </Pressable>
              ))}

              <Pressable style={styles.createNewRow} onPress={startCreateSubject}>
                <View style={[styles.suggestionIcon, { backgroundColor: colors.surfaceAlt }]}>
                  <Ionicons name="add" size={16} color={colors.accentText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionTitle}>Create New Subject</Text>
                  <Text style={styles.suggestionMeta}>
                    {result.suggestNewSubject
                      ? "We didn't find a great match."
                      : "Not seeing the right fit?"}
                  </Text>
                </View>
              </Pressable>
            </View>
          </>
        )}

        {stage === "createSubject" && (
          <>
            <View style={styles.aiMsgRow}>
              <View style={styles.botAvatar}>
                <Ionicons name="sparkles" size={12} color={colors.onAccent} />
              </View>
              <View style={[styles.bubble, styles.bubbleBot]}>
                <Text style={styles.bubbleTextBot}>
                  I'll create a new subject for you. What would you like to name it?
                </Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>New Subject</Text>
              <TextInput
                value={subjectName}
                onChangeText={setSubjectName}
                placeholder="Subject name"
                placeholderTextColor={colors.textFaint}
                style={styles.formInput}
              />

              <Text style={styles.formLabel}>Under which field?</Text>
              <Pressable
                style={styles.dropdown}
                onPress={() => setFieldPickerOpen((o) => !o)}
              >
                <Ionicons name={(selectedField?.icon || "folder") as any} size={16} color={colors.text} />
                <Text style={styles.dropdownText}>{selectedField?.title ?? "Choose a field"}</Text>
                <Ionicons
                  name={fieldPickerOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.textFaint}
                />
              </Pressable>
              {fieldPickerOpen && (
                <View style={styles.dropdownList}>
                  {fields.map((f) => (
                    <Pressable
                      key={f.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedFieldId(f.id);
                        setFieldPickerOpen(false);
                      }}
                    >
                      <Ionicons name={(f.icon || "folder") as any} size={15} color={colors.text} />
                      <Text style={styles.dropdownItemText}>{f.title}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Pressable
                style={[
                  styles.primaryBtn,
                  (!subjectName.trim() || !selectedFieldId) && { opacity: 0.5 },
                ]}
                disabled={!subjectName.trim() || !selectedFieldId}
                onPress={handleCreateSubject}
              >
                <Text style={styles.primaryBtnText}>Create</Text>
              </Pressable>
            </View>
          </>
        )}

        {stage === "created" && (
          <View style={styles.createdCard}>
            <Ionicons name="checkmark-circle" size={20} color={colors.accentText} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.createdTitle}>Subject created!</Text>
              <View style={styles.createdRow}>
                <View style={styles.createdIcon}>
                  <Ionicons name={(selectedField?.icon || "folder") as any} size={14} color={colors.onAccent} />
                </View>
                <View>
                  <Text style={styles.createdSubject}>{subjectName}</Text>
                  <Text style={styles.createdField}>Under: {selectedField?.title}</Text>
                </View>
              </View>
              <Pressable onPress={() => navigation.navigate("Tree")}>
                <Text style={styles.viewTreeLink}>View in Tree →</Text>
              </Pressable>
            </View>
          </View>
        )}

        <AiDisclaimer style={{ marginTop: 20 }} />
      </ScrollView>

      {stage === "suggestions" && selectedId && (
        <View style={styles.bottomBar}>
          <Pressable style={styles.primaryBtn} onPress={handleAddToSelected}>
            <Text style={styles.primaryBtnText}>
              Add to {nodes.find((n) => n.id === selectedId)?.title}
            </Text>
          </Pressable>
          <Pressable onPress={startCreateSubject}>
            <Text style={styles.secondaryLink}>View other options</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.accentOrange,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  headerSubtitle: { color: colors.textMuted, fontSize: 11 },
  label: { color: colors.text, fontWeight: "700", marginBottom: 10, fontSize: 13 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  searchStatic: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" },
  errorText: { color: colors.accentRed, fontSize: 12, marginBottom: 12 },
  primaryBtn: {
    backgroundColor: colors.accentTeal,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryBtnText: { color: colors.onAccent, fontWeight: "700", fontSize: 14 },
  sectionLabel: { color: colors.text, fontWeight: "700", fontSize: 14 },
  sectionHint: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionRowActive: { borderColor: colors.accentTeal },
  suggestionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.accentBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTitle: { color: colors.text, fontWeight: "700", fontSize: 13 },
  suggestionMeta: { color: colors.textFaint, fontSize: 11, marginTop: 1 },
  suggestionConfidence: { color: colors.accentTeal, fontSize: 11, marginTop: 1, fontWeight: "600" },
  createNewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  aiMsgRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 16 },
  botAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accentOrange,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 12 },
  bubbleBot: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bubbleTextBot: { color: colors.text, fontSize: 13, lineHeight: 20 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  formTitle: { color: colors.text, fontWeight: "700", fontSize: 14, marginBottom: 2 },
  formInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  formLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "600" },
  dropdownList: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dropdownItemText: { color: colors.text, fontSize: 13 },
  createdCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.accentTeal,
  },
  createdTitle: { color: colors.text, fontWeight: "700", fontSize: 14, marginBottom: 10 },
  createdRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  createdIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  createdSubject: { color: colors.text, fontWeight: "700", fontSize: 13 },
  createdField: { color: colors.textFaint, fontSize: 11, marginTop: 1 },
  viewTreeLink: { color: colors.accentBlue, fontSize: 12, marginTop: 12 },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
    alignItems: "center",
  },
  secondaryLink: { color: colors.textMuted, fontSize: 13 },
});
