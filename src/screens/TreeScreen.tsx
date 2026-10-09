import React, { useRef, useState } from "react";
import { Alert, Animated, Modal, PanResponder, View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colorForIndex } from "../theme/colors";
import type { Colors } from "../theme/colors";
import { useColors } from "../context/ThemeContext";
import { useStyles } from "../theme/useStyles";
import { useNodes } from "../context/NodeContext";
import { StrixNode } from "../types";
import { BrandIcon, knowledgeIcons, KnowledgeIcon } from "../branding/Brand";

const DEFAULT_ICONS: Record<string, string> = { field: "folder", subject: "layers", topic: "git-branch", lesson: "book", word: "document-text" };

export default function TreeScreen() {
  const { getChildren, nodes, getPath, reorderChildren } = useNodes();
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const [search, setSearch] = useState("");
  const [menuLesson, setMenuLesson] = useState<StrixNode | null>(null);
  const [menuNode, setMenuNode] = useState<StrixNode | null>(null);
  const [lessonTermsOpen, setLessonTermsOpen] = useState<Record<string, boolean>>({});
  const roots = getChildren(null);
  const moveRootField = (id: string, nextIndex: number) => {
    const currentIndex = roots.findIndex((root) => root.id === id);
    if (currentIndex < 0 || currentIndex === nextIndex) return;
    const next = [...roots];
    const [field] = next.splice(currentIndex, 1);
    next.splice(nextIndex, 0, field);
    reorderChildren(null, next.map((root) => root.id));
  };
  const query = search.trim().toLowerCase();
  const matches = query ? nodes.filter((node) => node.title.toLowerCase().includes(query)) : [];
  return <View style={styles.screen}>
    <View style={styles.header}><View style={styles.headerMark}><BrandIcon name="tree" active /></View><View style={{ flex: 1 }}><Text style={styles.headerTitle}>Tree</Text><Text style={styles.headerSubtitle}>Your knowledge tree.</Text></View><BrandIcon name="more" /></View>
    <View style={styles.searchBar}><Ionicons name="search" size={16} color={colors.textFaint} /><TextInput value={search} onChangeText={setSearch} placeholder="Search in tree..." placeholderTextColor={colors.textFaint} style={styles.searchInput} />{query.length > 0 && <Pressable onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color={colors.textFaint} /></Pressable>}</View>
    <ScrollView contentContainerStyle={styles.list}>
      {query ? matches.map((node) => <SearchRow key={node.id} node={node} path={getPath(node.id)} onMenu={setMenuNode} />) : roots.map((root, index) => <TreeBranch key={root.id} node={root} depth={0} colorIndex={index} onLessonMenu={setMenuLesson} onNodeMenu={setMenuNode} lessonTermsOpen={lessonTermsOpen} onSetLessonTerms={(id, open) => setLessonTermsOpen((current) => ({ ...current, [id]: open }))} rootIndex={index} rootCount={roots.length} onMoveRoot={moveRootField} />)}
      {query && matches.length === 0 && <Text style={styles.empty}>No notes or lessons match “{search}”.</Text>}
      {!query && roots.length === 0 && <Text style={styles.empty}>Create your first field to start your knowledge tree.</Text>}
    </ScrollView>
    <LessonMenu lesson={menuLesson} termsShown={menuLesson ? lessonTermsOpen[menuLesson.id] ?? true : false} onToggleTerms={() => menuLesson && setLessonTermsOpen((current) => ({ ...current, [menuLesson.id]: !(current[menuLesson.id] ?? true) }))} onClose={() => setMenuLesson(null)} />
    <NodeMenu node={menuNode} onClose={() => setMenuNode(null)} />
  </View>;
}

// Long-press on any row: rename/open it (NodeDetail edits the name and the
// notes) or delete it. Previously long-press went straight to the delete
// confirm, which left fields and subjects with children with no edit path.
function NodeMenu({ node, onClose }: { node: StrixNode | null; onClose: () => void }) {
  const navigation = useNavigation<any>();
  const { deleteNode } = useNodes();
  const colors = useColors();
  const styles = useStyles(makeStyles);
  if (!node) return null;
  const label = node.level === "word" ? "term" : node.level;
  return <Modal transparent visible animationType="fade" onRequestClose={onClose}><Pressable style={styles.menuShade} onPress={onClose}><Pressable style={styles.lessonMenu} onPress={() => {}}><Pressable style={styles.menuItem} onPress={() => { onClose(); navigation.navigate("NodeDetail", { nodeId: node.id, edit: true }); }}><Ionicons name="pencil-outline" size={18} color={colors.linkBlue} /><Text style={styles.menuText}>Edit {label} name</Text></Pressable><Pressable style={styles.menuItem} onPress={() => { onClose(); navigation.navigate("NodeDetail", { nodeId: node.id }); }}><Ionicons name="eye-outline" size={18} color={colors.linkBlue} /><Text style={styles.menuText}>View details</Text></Pressable><View style={styles.menuDivider} /><Pressable style={styles.menuItem} onPress={() => { onClose(); confirmDelete(node, deleteNode); }}><Ionicons name="trash-outline" size={18} color={colors.accentRed} /><Text style={[styles.menuText, { color: colors.accentRed }]}>Delete</Text></Pressable></Pressable></Pressable></Modal>;
}

function SearchRow({ node, path, onMenu }: { node: StrixNode; path: StrixNode[]; onMenu: (node: StrixNode) => void }) {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const styles = useStyles(makeStyles);
  return <Pressable style={styles.searchResult} onPress={() => navigation.navigate("NodeDetail", { nodeId: node.id })} onLongPress={() => onMenu(node)} delayLongPress={450}><NodeIcon node={node} color={colors.accentTeal} /><View style={{ flex: 1 }}><Text style={styles.nodeTitle}>{node.title}</Text><Text style={styles.path}>{path.map((part) => part.title).join("  ›  ")}</Text></View><Ionicons name="chevron-forward" size={16} color={colors.textFaint} /></Pressable>;
}

function TreeBranch({ node, depth, colorIndex, onLessonMenu, onNodeMenu, lessonTermsOpen, onSetLessonTerms, rootIndex, rootCount, onMoveRoot }: { node: StrixNode; depth: number; colorIndex: number; onLessonMenu: (lesson: StrixNode) => void; onNodeMenu: (node: StrixNode) => void; lessonTermsOpen: Record<string, boolean>; onSetLessonTerms: (id: string, open: boolean) => void; rootIndex?: number; rootCount?: number; onMoveRoot?: (id: string, index: number) => void }) {
  const navigation = useNavigation<any>();
  const { getChildren } = useNodes();
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const children = getChildren(node.id);
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = children.length > 0;
  // Lesson terms are visible by default once the lesson's parent is open.
  // The three-dot menu can change this without touching the underlying data.
  const isOpen = node.level === "lesson" ? lessonTermsOpen[node.id] ?? true : open;
  const color = colorForIndex(colorIndex);
  const isRoot = depth === 0;
  return <View style={isRoot ? styles.rootBranch : styles.branch}>
    <Pressable onPress={() => hasChildren ? (node.level === "lesson" ? onSetLessonTerms(node.id, !isOpen) : setOpen((value) => !value)) : navigation.navigate("NodeDetail", { nodeId: node.id })} onLongPress={() => onNodeMenu(node)} delayLongPress={450} style={[styles.nodeRow, isRoot && styles.rootRow]}>
      {isRoot ? <NodeIcon node={node} color={color} large /> : <View style={[styles.connectorDot, { borderColor: color, backgroundColor: colors.background }]} />}
      {!isRoot && <NodeIcon node={node} color={colors.accentTeal} />}
      <View style={{ flex: 1 }}><Text style={[styles.nodeTitle, isRoot && styles.rootTitle]}>{node.title}</Text><Text style={styles.nodeMeta}>{hasChildren ? `${children.length} ${children.length === 1 ? "item" : "items"}` : node.level === "word" ? "Note" : node.level}</Text>{node.level === "word" && (node.description || node.content?.value) && <Text style={styles.preview} numberOfLines={1}>{node.description || node.content?.value}</Text>}</View>
      {isRoot && rootIndex !== undefined && rootCount !== undefined && onMoveRoot ? <FieldDragHandle nodeId={node.id} index={rootIndex} count={rootCount} onMove={onMoveRoot} /> : node.level === "lesson" ? <Pressable hitSlop={10} onPress={() => onLessonMenu(node)} style={styles.moreButton}><Ionicons name="ellipsis-vertical" size={18} color={colors.linkBlue} /></Pressable> : hasChildren && <Ionicons name={isOpen ? "chevron-down" : "chevron-forward"} size={17} color={colors.textMuted} />}
    </Pressable>
    {hasChildren && isOpen && <View style={[styles.children, { borderLeftColor: `${color}99` }]}>{children.map((child) => <TreeBranch key={child.id} node={child} depth={depth + 1} colorIndex={colorIndex} onLessonMenu={onLessonMenu} onNodeMenu={onNodeMenu} lessonTermsOpen={lessonTermsOpen} onSetLessonTerms={onSetLessonTerms} />)}</View>}
  </View>;
}

function FieldDragHandle({ nodeId, index, count, onMove }: { nodeId: string; index: number; count: number; onMove: (id: string, nextIndex: number) => void }) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const translation = useRef(new Animated.ValueXY()).current;
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 2,
    onPanResponderMove: (_, gesture) => translation.setValue({ x: 0, y: gesture.dy }),
    onPanResponderRelease: (_, gesture) => {
      const steps = Math.round(gesture.dy / 72);
      const nextIndex = Math.max(0, Math.min(count - 1, index + steps));
      Animated.spring(translation, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
      onMove(nodeId, nextIndex);
    },
    onPanResponderTerminate: () => Animated.spring(translation, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start(),
  })).current;
  return <Animated.View {...responder.panHandlers} style={[styles.dragHandle, { transform: translation.getTranslateTransform() }]}><Ionicons name="reorder-three-outline" size={22} color={colors.linkBlue} /></Animated.View>;
}

function LessonMenu({ lesson, termsShown, onToggleTerms, onClose }: { lesson: StrixNode | null; termsShown: boolean; onToggleTerms: () => void; onClose: () => void }) {
  const navigation = useNavigation<any>();
  const { deleteNode } = useNodes();
  const colors = useColors();
  const styles = useStyles(makeStyles);
  if (!lesson) return null;
  const open = (screen: string, edit = false) => { onClose(); navigation.navigate(screen, { nodeId: lesson.id, lessonId: lesson.id, ...(edit ? { edit: true } : {}) }); };
  return <Modal transparent visible animationType="fade" onRequestClose={onClose}><Pressable style={styles.menuShade} onPress={onClose}><Pressable style={styles.lessonMenu} onPress={() => {}}><Pressable style={styles.menuItem} onPress={() => open("NodeDetail")}><Ionicons name="eye-outline" size={18} color={colors.linkBlue} /><Text style={styles.menuText}>View Lesson</Text></Pressable><Pressable style={[styles.menuItem, styles.studyMenuItem]} onPress={() => open("StudySpace")}><Ionicons name="sparkles" size={18} color={colors.accentTeal} /><Text style={[styles.menuText, { color: colors.accentText }]}>Go to Study Space</Text></Pressable><Pressable style={styles.menuItem} onPress={() => { onToggleTerms(); onClose(); }}><Ionicons name={termsShown ? "eye-off-outline" : "eye-outline"} size={18} color={colors.linkBlue} /><Text style={styles.menuText}>{termsShown ? "Hide Terms" : "Show Terms"}</Text></Pressable><Pressable style={styles.menuItem} onPress={() => open("NodeDetail", true)}><Ionicons name="pencil-outline" size={18} color={colors.linkBlue} /><Text style={styles.menuText}>Edit</Text></Pressable><View style={styles.menuDivider} /><Pressable style={styles.menuItem} onPress={() => { onClose(); confirmDelete(lesson, deleteNode); }}><Ionicons name="trash-outline" size={18} color={colors.accentRed} /><Text style={[styles.menuText, { color: colors.accentRed }]}>Delete</Text></Pressable></Pressable></Pressable></Modal>;
}

function confirmDelete(node: StrixNode, deleteNode: (id: string) => void) {
  Alert.alert(
    `Delete ${node.title}?`,
    node.level === "word" ? "This note will be permanently deleted." : "This will also delete everything inside it.",
    [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteNode(node.id) }]
  );
}

function NodeIcon({ node, color, large = false }: { node: StrixNode; color: string; large?: boolean }) {
  const styles = useStyles(makeStyles);
  if (node.level === "field" || knowledgeIcons[node.title.trim().toLowerCase()]) return <KnowledgeIcon title={node.title} size={large ? 18 : 15} />;
  const icon = node.icon || DEFAULT_ICONS[node.level];
  return <View style={[styles.nodeIcon, large && styles.largeNodeIcon, { backgroundColor: `${color}20`, borderColor: `${color}55` }]}><Ionicons name={icon as any} size={large ? 18 : 15} color={color} /></View>;
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: 42 }, header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingBottom: 16 }, headerMark: { width: 28, alignItems: "center" }, headerTitle: { color: colors.text, fontSize: 18, fontWeight: "700" }, headerSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.input, marginHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10 }, searchInput: { flex: 1, color: colors.text, fontSize: 13 }, list: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 78 },
  rootBranch: { marginBottom: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: "hidden" }, branch: { position: "relative" }, rootRow: { padding: 12, backgroundColor: colors.surfaceAlt }, nodeRow: { minHeight: 51, flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 7, paddingRight: 10 }, children: { marginLeft: 27, paddingLeft: 12, paddingVertical: 5, borderLeftWidth: 1 }, connectorDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 2, marginLeft: -17, marginRight: 8 },
  nodeIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center", borderWidth: 1 }, largeNodeIcon: { width: 36, height: 36, borderRadius: 11 }, nodeTitle: { color: colors.text, fontSize: 13, fontWeight: "600" }, rootTitle: { fontSize: 14, fontWeight: "700" }, nodeMeta: { color: colors.textFaint, fontSize: 10, marginTop: 2, textTransform: "capitalize" }, moreButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: colors.chip }, dragHandle: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.chip, borderWidth: 1, borderColor: colors.border },
  searchResult: { flexDirection: "row", gap: 10, alignItems: "center", padding: 12, marginBottom: 9, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, path: { color: colors.textFaint, fontSize: 10, marginTop: 3 }, preview: { color: colors.textMuted, fontSize: 11, marginTop: 3 }, empty: { color: colors.textMuted, fontSize: 13, textAlign: "center", paddingTop: 36 }, menuShade: { flex: 1, backgroundColor: "rgba(0, 8, 17, 0.45)", justifyContent: "center", alignItems: "center", padding: 28 }, lessonMenu: { width: "100%", maxWidth: 300, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 16, paddingVertical: 6 }, menuItem: { flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 16, paddingVertical: 13 }, studyMenuItem: { backgroundColor: colors.highlight }, menuText: { color: colors.text, fontSize: 14, fontWeight: "600" }, menuDivider: { height: 1, backgroundColor: colors.border, marginVertical: 3 },
});
