import React, { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useNodes } from "../context/NodeContext";
import { useColors } from "../context/ThemeContext";
import type { Colors } from "../theme/colors";
import { useStyles } from "../theme/useStyles";
import { StrixNode } from "../types";
import { BrandIcon, KnowledgeIcon } from "../branding/Brand";

export default function StudySpaceScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { getNode, getPath, getChildren, addNode, updateNode, deleteNode } = useNodes();
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const lesson = getNode(route.params?.lessonId);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editor, setEditor] = useState<StrixNode | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [definition, setDefinition] = useState("");

  if (!lesson || lesson.level !== "lesson") return <View style={styles.screen}><Text style={styles.empty}>This lesson is no longer available.</Text></View>;
  const terms = getChildren(lesson.id).filter((node) => node.level === "word");
  const path = getPath(lesson.id);
  const openEditor = (term: StrixNode | "new") => { setEditor(term); setTitle(term === "new" ? "" : term.title); setDefinition(term === "new" ? "" : term.content?.value ?? term.description ?? ""); };
  const saveTerm = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (editor === "new") addNode({ parentId: lesson.id, level: "word", title: trimmed, content: definition.trim() ? { kind: "text", value: definition.trim() } : undefined });
    else if (editor) updateNode(editor.id, { title: trimmed, content: definition.trim() ? { kind: "text", value: definition.trim() } : undefined });
    setEditor(null);
  };
  const removeTerm = (term: StrixNode) => Alert.alert(`Delete ${term.title}?`, "This removes the actual term from this lesson.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteNode(term.id) }]);

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
      <View style={styles.header}><Pressable onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="chevron-back" size={23} color={colors.text} /></Pressable><View style={{ flex: 1 }}><Text style={styles.headerTitle} numberOfLines={1}>{lesson.title}</Text><Text style={styles.headerSub}>Study Space</Text></View><BrandIcon name="tree" active boxed /></View>
      <Text style={styles.path} numberOfLines={2}>{path.slice(0, -1).map((node) => node.title).join("  ›  ")}</Text>
      <View style={styles.lessonCard}><KnowledgeIcon title={path[0]?.title ?? lesson.title} size={25} /><View style={{ flex: 1 }}><Text style={styles.lessonTitle}>{lesson.title}</Text><Text style={styles.termCount}>{terms.length} {terms.length === 1 ? "Term" : "Terms"}</Text></View></View>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Terms</Text><Text style={styles.sectionCount}>{terms.length} terms</Text></View>
      {terms.length ? terms.map((term) => <TermRow key={term.id} term={term} open={!!expanded[term.id]} onToggle={() => setExpanded((current) => ({ ...current, [term.id]: !current[term.id] }))} onEdit={() => openEditor(term)} onDelete={() => removeTerm(term)} />) : <View style={styles.emptyCard}><Ionicons name="leaf-outline" size={28} color={colors.accentTeal} /><Text style={styles.emptyTitle}>No terms yet</Text><Text style={styles.emptyCopy}>Add the first term for this lesson when you’re ready to review it.</Text></View>}
      <Pressable onPress={() => openEditor("new")} style={styles.addButton}><Ionicons name="add" size={19} color={colors.accentTeal} /><Text style={styles.addText}>Add Term</Text></Pressable>
    </ScrollView>
    <TermEditor visible={editor !== null} title={title} definition={definition} isNew={editor === "new"} onChangeTitle={setTitle} onChangeDefinition={setDefinition} onClose={() => setEditor(null)} onSave={saveTerm} />
  </View>;
}

function TermRow({ term, open, onToggle, onEdit, onDelete }: { term: StrixNode; open: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const definition = term.content?.value ?? term.description;
  return <View style={[styles.termRow, open && styles.termRowOpen]}><Pressable onPress={onToggle} style={styles.termMain}><View style={styles.termIcon}><Ionicons name="bulb-outline" size={16} color={colors.accentTeal} /></View><Text style={styles.termName}>{term.title}</Text><Ionicons name={open ? "chevron-up" : "chevron-down"} size={17} color={colors.linkBlue} /></Pressable>{open && <View style={styles.termBody}>{definition ? <Text style={styles.definition} selectable>{definition}</Text> : <Text style={styles.noDefinition}>No definition added yet.</Text>}<View style={styles.termActions}><Pressable onPress={onEdit} style={styles.termAction}><Ionicons name="pencil-outline" size={15} color={colors.linkBlue} /><Text style={styles.actionText}>Edit</Text></Pressable><Pressable onPress={onDelete} style={styles.termAction}><Ionicons name="trash-outline" size={15} color={colors.accentRed} /><Text style={[styles.actionText, { color: colors.accentRed }]}>Delete</Text></Pressable></View></View>}</View>;
}

function TermEditor({ visible, title, definition, isNew, onChangeTitle, onChangeDefinition, onClose, onSave }: { visible: boolean; title: string; definition: string; isNew: boolean; onChangeTitle: (text: string) => void; onChangeDefinition: (text: string) => void; onClose: () => void; onSave: () => void }) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalShade}><View style={styles.editor}><View style={styles.editorHeader}><Text style={styles.editorTitle}>{isNew ? "Add Term" : "Edit Term"}</Text><Pressable onPress={onClose}><Ionicons name="close" size={23} color={colors.text} /></Pressable></View><Text style={styles.inputLabel}>TERM NAME</Text><TextInput value={title} onChangeText={onChangeTitle} placeholder="e.g. Checked Exception" placeholderTextColor={colors.textFaint} style={styles.input} autoFocus /><Text style={styles.inputLabel}>DEFINITION</Text><TextInput value={definition} onChangeText={onChangeDefinition} placeholder="Write a clear definition…" placeholderTextColor={colors.textFaint} style={[styles.input, styles.definitionInput]} multiline textAlignVertical="top" /><Pressable onPress={onSave} disabled={!title.trim()} style={[styles.saveButton, !title.trim() && { opacity: 0.45 }]}><Text style={styles.saveText}>{isNew ? "Add to Lesson" : "Save Changes"}</Text></Pressable></View></View></Modal>;
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingTop: 44, paddingBottom: 56, gap: 10 }, header: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 4 }, back: { width: 35, height: 35, borderRadius: 18, backgroundColor: colors.chip, alignItems: "center", justifyContent: "center" }, headerTitle: { color: colors.text, fontSize: 19, fontWeight: "800" }, headerSub: { color: colors.accentText, fontSize: 11, marginTop: 1 }, path: { color: colors.linkBlue, fontSize: 11, lineHeight: 16, marginBottom: 10 }, lessonCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 13, borderRadius: 16, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong, marginBottom: 14 }, lessonTitle: { color: colors.text, fontSize: 15, fontWeight: "700" }, termCount: { color: colors.subtleText, fontSize: 11, marginTop: 3 }, sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 1 }, sectionTitle: { color: colors.text, fontSize: 15, fontWeight: "800" }, sectionCount: { color: colors.linkBlue, fontSize: 11 }, termRow: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: "hidden" }, termRowOpen: { borderColor: colors.borderStrong, backgroundColor: colors.cardStrong }, termMain: { minHeight: 47, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 10 }, termIcon: { width: 27, height: 27, borderRadius: 9, backgroundColor: colors.iconWell, alignItems: "center", justifyContent: "center" }, termName: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "600" }, termBody: { borderTopWidth: 1, borderTopColor: colors.border, padding: 13, paddingTop: 11 }, definition: { color: colors.subtleText, fontSize: 13, lineHeight: 19 }, noDefinition: { color: colors.textFaint, fontSize: 12, fontStyle: "italic" }, termActions: { flexDirection: "row", gap: 16, marginTop: 12 }, termAction: { flexDirection: "row", alignItems: "center", gap: 5 }, actionText: { color: colors.linkBlue, fontSize: 11, fontWeight: "700" }, addButton: { minHeight: 49, marginTop: 12, borderRadius: 25, borderWidth: 1, borderColor: colors.accentTeal, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }, addText: { color: colors.accentText, fontSize: 13, fontWeight: "800" }, emptyCard: { borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 25, alignItems: "center" }, emptyTitle: { color: colors.text, fontSize: 14, fontWeight: "700", marginTop: 9 }, emptyCopy: { color: colors.textMuted, fontSize: 12, textAlign: "center", lineHeight: 17, marginTop: 4 }, empty: { color: colors.textMuted, textAlign: "center", marginTop: 80 }, modalShade: { flex: 1, backgroundColor: "rgba(0, 10, 20, 0.56)", justifyContent: "flex-end" }, editor: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: colors.borderStrong, padding: 20, paddingBottom: 34, gap: 9 }, editorHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }, editorTitle: { color: colors.text, fontSize: 18, fontWeight: "800" }, inputLabel: { color: colors.textFaint, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginTop: 4 }, input: { backgroundColor: colors.input, color: colors.text, borderRadius: 11, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 }, definitionInput: { minHeight: 118 }, saveButton: { marginTop: 9, borderRadius: 25, backgroundColor: colors.accentTeal, paddingVertical: 14, alignItems: "center" }, saveText: { color: colors.onAccent, fontSize: 14, fontWeight: "800" },
});
