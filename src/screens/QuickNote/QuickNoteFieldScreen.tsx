import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { useNodes } from "../../context/NodeContext";
import { Header } from "./QuickNoteInputScreen";
import { StrixNode } from "../../types";

// A flat picker of every non-leaf node, shown with its breadcrumb path,
// so the new note can be placed anywhere in the flexible tree — directly
// under a Field, or several levels deep. Matches the "skip levels freely"
// requirement from the PRD.
//
// The search bar at the top filters the whole list live (by name OR by any
// part of its path), so with dozens of lessons you can type a few letters
// instead of scrolling to find the right spot.
export default function QuickNoteFieldScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { term, level } = route.params;
  const { nodes, getPath, addNode } = useNodes();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingField, setAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [search, setSearch] = useState("");

  const candidates = useMemo(
    () => nodes.filter((n) => n.level !== "word"),
    [nodes]
  );

  const query = search.trim().toLowerCase();
  const results = useMemo(() => {
    const withPath = candidates.map((n) => ({
      node: n,
      crumb: getPath(n.id).map((p) => p.title).join("  ›  "),
    }));
    if (!query) return withPath;
    return withPath
      .filter(
        ({ node, crumb }) =>
          node.title.toLowerCase().includes(query) ||
          crumb.toLowerCase().includes(query)
      )
      // Exact/prefix name matches first, so the intended spot leads the list.
      .sort((a, b) => {
        const aStarts = a.node.title.toLowerCase().startsWith(query) ? 0 : 1;
        const bStarts = b.node.title.toLowerCase().startsWith(query) ? 0 : 1;
        return aStarts - bStarts;
      });
  }, [candidates, query, getPath]);

  const createField = () => {
    if (!newFieldName.trim()) return;
    const node = addNode({
      parentId: null,
      level: "field",
      title: newFieldName.trim(),
    });
    setSelectedId(node.id);
    setNewFieldName("");
    setAddingField(false);
  };

  return (
    <View style={styles.screen}>
      <Header title="Choose Field" subtitle={`Placing "${term}"`} />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={colors.textFaint} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search a field, subject, or lesson..."
          placeholderTextColor={colors.textFaint}
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={colors.textFaint} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        {results.map(({ node: n, crumb }) => {
          const selected = selectedId === n.id;
          return (
            <Pressable
              key={n.id}
              style={[styles.row, selected && styles.rowSelected]}
              onPress={() => setSelectedId(n.id)}
            >
              <View style={styles.rowIcon}>
                <Ionicons
                  name={
                    n.level === "lesson"
                      ? "book"
                      : n.level === "subject"
                      ? "layers"
                      : "folder"
                  }
                  size={16}
                  color={colors.text}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{n.title}</Text>
                <Text style={styles.rowCrumb} numberOfLines={1}>{crumb}</Text>
              </View>
              {selected && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.accentTeal}
                />
              )}
            </Pressable>
          );
        })}

        {query.length > 0 && results.length === 0 && (
          <Text style={styles.noResults}>
            Nothing matches “{search}”. Try a shorter word, or add a new field
            below.
          </Text>
        )}

        {addingField ? (
          <View style={styles.addRow}>
            <TextInput
              value={newFieldName}
              onChangeText={setNewFieldName}
              placeholder="New field name..."
              placeholderTextColor={colors.textFaint}
              style={styles.addInput}
              autoFocus
              onSubmitEditing={createField}
            />
            <Pressable onPress={createField}>
              <Ionicons name="checkmark" size={20} color={colors.accentTeal} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.addBtn} onPress={() => setAddingField(true)}>
            <Ionicons name="add" size={16} color={colors.accentTeal} />
            <Text style={styles.addBtnText}>Add New Field</Text>
          </Pressable>
        )}
      </ScrollView>

      <Pressable
        style={[styles.nextBtn, !selectedId && { opacity: 0.5 }]}
        disabled={!selectedId}
        onPress={() =>
          navigation.navigate("QuickNoteContent", {
            term,
            level,
            parentId: selectedId,
          })
        }
      >
        <Text style={styles.nextBtnText}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: 44, paddingHorizontal: 20 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentTeal,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 13 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowSelected: { borderColor: colors.accentTeal },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { color: colors.text, fontWeight: "600", fontSize: 13 },
  rowCrumb: { color: colors.textFaint, fontSize: 11, marginTop: 1 },
  noResults: { color: colors.textMuted, fontSize: 13, lineHeight: 19, paddingVertical: 10 },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.accentTeal,
  },
  addInput: { flex: 1, color: colors.text, fontSize: 13 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8 },
  addBtnText: { color: colors.accentTeal, fontWeight: "600", fontSize: 13 },
  nextBtn: {
    backgroundColor: colors.accentTeal,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 16,
  },
  nextBtnText: { color: "#0B0F19", fontWeight: "700", fontSize: 14 },
});
