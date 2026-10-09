import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useNodes } from "../context/NodeContext";
import { useApiKey } from "../context/ApiKeyContext";
import { generateDefinition } from "../services/ai/aiService";
import { isAiAvailable } from "../services/ai/aiRuntime";
import { AiDisclaimer } from "../components/AiDisclaimer";
import { StrixNode } from "../types";
import { useColors } from "../context/ThemeContext";
import { useStyles } from "../theme/useStyles";
import type { Colors } from "../theme/colors";
import type { AddedEntry, BatchLevel } from "../utils/pendingBatch";
import { firstMade, isPendingId, pendingId, resolveId, shiftPendingSelection } from "../utils/pendingBatch";

type Step = 1 | 2 | 3 | 4;
const FIELD_ICONS = ["folder", "laptop", "restaurant", "heart", "person", "briefcase"] as const;
const SUBJECT_ICONS = ["layers", "code-slash", "hardware-chip", "globe", "book", "fitness"] as const;
const LESSON_ICONS = ["book", "document-text", "play-circle", "library", "bulb"] as const;

export default function CreateScreen() {
  const navigation = useNavigation<any>();
  const { addNode, getChildren, deleteNode, updateNode, getPath } = useNodes();
  const { apiKey } = useApiKey();
  const [step, setStep] = useState<Step>(1);
  const [fieldId, setFieldId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [newField, setNewField] = useState(false);
  const [newSubject, setNewSubject] = useState(false);
  const [newLesson, setNewLesson] = useState(false);
  const [fieldName, setFieldName] = useState(""); const [fieldIcon, setFieldIcon] = useState("folder");
  const [subjectName, setSubjectName] = useState(""); const [subjectIcon, setSubjectIcon] = useState("layers");
  const [lessonName, setLessonName] = useState(""); const [lessonIcon, setLessonIcon] = useState("book");
  const [word, setWord] = useState(""); const [note, setNote] = useState("");
  // Everything put in with the "Add more?" button — several at once, each one
  // still pickable. Nothing here is persisted until Save.
  const [added, setAdded] = useState<Record<BatchLevel, AddedEntry[]>>({ field: [], subject: [], lesson: [], word: [] });
  const [aiLoading, setAiLoading] = useState(false);

  const iconFor = (level: BatchLevel) => (level === "field" ? fieldIcon : level === "subject" ? subjectIcon : level === "lesson" ? lessonIcon : "document-text");
  // Added entries shaped like real nodes so they can share the breadcrumb and
  // the selection state before they exist.
  const draftNodes = (level: BatchLevel): StrixNode[] =>
    added[level].map((entry, index) => ({ id: pendingId(level, index), parentId: null, level, title: entry.title, icon: iconFor(level), createdAt: 0, updatedAt: 0 }));
  const pickedDraft = (level: BatchLevel, id: string | null) =>
    !!id && isPendingId(id) && added[level].some((_, index) => pendingId(level, index) === id);
  // A selection counts when it points at something real or at an entry that is
  // still on the list — a draft whose entry was removed no longer counts.
  const validPick = (level: BatchLevel, id: string | null) => (isPendingId(id) ? pickedDraft(level, id) : !!id);

  const fields = useMemo(() => [...getChildren(null), ...draftNodes("field")], [getChildren, added, fieldIcon]);
  const subjects = useMemo(() => [...(fieldId ? getChildren(fieldId).filter((node) => node.level === "subject") : []), ...draftNodes("subject")], [fieldId, getChildren, added, subjectIcon]);
  const lessons = useMemo(() => [...(subjectId ? getChildren(subjectId).filter((node) => node.level === "lesson") : []), ...draftNodes("lesson")], [subjectId, getChildren, added, lessonIcon]);
  const selectedField = fields.find((node) => node.id === fieldId);
  const selectedSubject = subjects.find((node) => node.id === subjectId);
  const selectedLesson = lessons.find((node) => node.id === lessonId);
  // The pickers only ever list what is already saved — added entries show up
  // in the form directly under them.
  const savedOnly = (nodes: StrixNode[]) => nodes.filter((node) => !isPendingId(node.id));

  // What exists but isn't persisted yet: added entries plus whatever is typed
  // in a box. Saving is allowed at any step for whatever has been filled in so
  // far — you never have to reach the word/note step just to commit a field,
  // subject or lesson.
  const pendingField = added.field.length > 0 || (newField && !!fieldName.trim());
  const pendingSubject = added.subject.length > 0 || (newSubject && !!subjectName.trim());
  const pendingLesson = added.lesson.length > 0 || (newLesson && !!lessonName.trim());
  const pendingWord = added.word.length > 0 || !!word.trim();

  // Continue needs a pick as soon as entries were added (pick one of them, or
  // deliberately use an existing node); before that it's just the typed name.
  const canContinue =
    step === 1 ? (newField && added.field.length === 0 ? !!fieldName.trim() : validPick("field", fieldId))
      : step === 2 ? (newSubject && added.subject.length === 0 ? !!subjectName.trim() : validPick("subject", subjectId))
        : step === 3 ? (newLesson && added.lesson.length === 0 ? !!lessonName.trim() : validPick("lesson", lessonId))
          : pendingWord;

  const fieldOk = pendingField || validPick("field", fieldId);
  const subjectOk = pendingSubject || validPick("subject", subjectId);
  const lessonOk = pendingLesson || validPick("lesson", lessonId);
  const canSave =
    pendingField ||
    (pendingSubject && fieldOk) ||
    (pendingLesson && fieldOk && subjectOk) ||
    (step === 4 && pendingWord && fieldOk && subjectOk && lessonOk);

  // Path handed to the AI definition writer: the real path when the lesson is
  // already saved, otherwise the entries stitched together by hand.
  const definitionPath = useMemo(() => {
    const fromTree = lessonId ? getPath(lessonId) : [];
    if (fromTree.length > 0) return fromTree;
    return [selectedField, selectedSubject, selectedLesson].filter((node): node is StrixNode => !!node);
  }, [lessonId, getPath, selectedField, selectedSubject, selectedLesson]);

  const colors = useColors();
  const styles = useStyles(makeStyles);

  const reset = () => { setStep(1); setFieldId(null); setSubjectId(null); setLessonId(null); setNewField(false); setNewSubject(false); setNewLesson(false); setFieldName(""); setSubjectName(""); setLessonName(""); setWord(""); setNote(""); setAdded({ field: [], subject: [], lesson: [], word: [] }); };
  const next = () => {
    if (!canContinue || step >= 4) return;
    setStep((value) => (value + 1) as Step);
  };

  const addEntry = (level: BatchLevel, title: string, content?: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setAdded((prev) => ({ ...prev, [level]: [...prev[level], { title: trimmed, content: content?.trim() || undefined }] }));
  };
  const updateEntry = (level: BatchLevel, index: number, title: string, content: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setAdded((prev) => ({ ...prev, [level]: prev[level].map((entry, i) => (i === index ? { title: trimmed, content: content.trim() || undefined } : entry)) }));
  };
  const removeEntry = (level: BatchLevel, index: number) => {
    setAdded((prev) => ({ ...prev, [level]: prev[level].filter((_, i) => i !== index) }));
    const selected = level === "field" ? fieldId : level === "subject" ? subjectId : level === "lesson" ? lessonId : null;
    const nextId = shiftPendingSelection(selected, level, index);
    if (nextId === selected) return;
    if (level === "field") { setFieldId(nextId); setSubjectId(null); setLessonId(null); }
    else if (level === "subject") { setSubjectId(nextId); setLessonId(null); }
    else if (level === "lesson") setLessonId(nextId);
  };
  // Picking an entry also keeps the create-form open, so the list it lives in
  // never disappears while it still holds something.
  const pickEntry = (level: BatchLevel, index: number) => {
    const id = pendingId(level, index);
    if (level === "field") { setNewField(true); setFieldId(id); setSubjectId(null); setLessonId(null); }
    else if (level === "subject") { setNewSubject(true); setSubjectId(id); setLessonId(null); }
    else if (level === "lesson") { setNewLesson(true); setLessonId(id); }
  };
  const addFieldEntry = () => { addEntry("field", fieldName); setFieldName(""); };
  const addSubjectEntry = () => { addEntry("subject", subjectName); setSubjectName(""); };
  const addLessonEntry = () => { addEntry("lesson", lessonName); setLessonName(""); };
  const addWordEntry = () => { addEntry("word", word, note); setWord(""); setNote(""); };

  // Persists only what exists right now, creating any missing parents on the way
  // down, then stops. Saves on step 4 simply add the words too.
  const save = () => {
    if (!canSave) return;
    // Added entries go in first, so the picked one can be swapped for its real
    // id and carry the rest of the chain underneath it. Whatever is still typed
    // in a box is saved too — one more node alongside them.
    const made = { field: new Map<string, string>(), subject: new Map<string, string>(), lesson: new Map<string, string>() };
    added.field.forEach((entry, index) => made.field.set(pendingId("field", index), addNode({ parentId: null, level: "field", title: entry.title, icon: fieldIcon }).id));
    let savedField = resolveId(fieldId, made.field) ?? firstMade(made.field);
    if (newField && fieldName.trim()) {
      const typed = addNode({ parentId: null, level: "field", title: fieldName.trim(), icon: fieldIcon }).id;
      if (savedField === null) savedField = typed;
    }

    if (savedField) {
      const parentId = savedField;
      added.subject.forEach((entry, index) => made.subject.set(pendingId("subject", index), addNode({ parentId, level: "subject", title: entry.title, icon: subjectIcon }).id));
    }
    let savedSubject = resolveId(subjectId, made.subject) ?? firstMade(made.subject);
    if (savedField && newSubject && subjectName.trim()) {
      const typed = addNode({ parentId: savedField, level: "subject", title: subjectName.trim(), icon: subjectIcon }).id;
      if (savedSubject === null) savedSubject = typed;
    }

    if (savedSubject) {
      const parentId = savedSubject;
      added.lesson.forEach((entry, index) => made.lesson.set(pendingId("lesson", index), addNode({ parentId, level: "lesson", title: entry.title, icon: lessonIcon }).id));
    }
    let savedLesson = resolveId(lessonId, made.lesson) ?? firstMade(made.lesson);
    if (savedSubject && newLesson && lessonName.trim()) {
      const typed = addNode({ parentId: savedSubject, level: "lesson", title: lessonName.trim(), icon: lessonIcon }).id;
      if (savedLesson === null) savedLesson = typed;
    }

    if (step === 4 && savedLesson) {
      const parentId = savedLesson;
      added.word.forEach((entry) => addNode({ parentId, level: "word", title: entry.title, icon: "document-text", content: entry.content ? { kind: "text", value: entry.content } : undefined }));
      if (word.trim()) addNode({ parentId, level: "word", title: word.trim(), icon: "document-text", content: note.trim() ? { kind: "text", value: note.trim() } : undefined });
    }
    reset();
    navigation.navigate("Tree");
  };

  const requireKey = () => {
    if (isAiAvailable(apiKey)) return true;
    Alert.alert(
      "Optional cloud key needed",
      "Cloud mode requires a Gemini key. Switch back to local mode or add a key in AI settings.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Cloud settings", onPress: () => navigation.navigate("ApiKey") },
      ]
    );
    return false;
  };

  // The same location-aware writer the Quick Note flow uses: the path
  // (Field › Subject › Lesson) plus any notes already in the lesson, so a
  // spelling that changes meaning by subject comes out right.
  const generateTerm = async (term: string): Promise<string | null> => {
    if (!requireKey()) return null;
    try {
      const definition = await generateDefinition({
        apiKey,
        term,
        parentPath: definitionPath,
        parentNote: selectedLesson?.description || selectedLesson?.content?.value || selectedSubject?.description,
      });
      return definition.slice(0, 2000);
    } catch (err: any) {
      Alert.alert("Couldn't generate definition", err?.message || "Try again in a moment.");
      return null;
    }
  };

  const handleAiDefinition = async () => {
    if (aiLoading || !word.trim()) return;
    const write = async () => {
      setAiLoading(true);
      const definition = await generateTerm(word.trim());
      setAiLoading(false);
      if (definition !== null) setNote(definition);
    };
    if (note.trim()) {
      Alert.alert("Replace your text?", "The AI definition will overwrite what you've written in the box.", [
        { text: "Keep mine", style: "cancel" },
        { text: "Replace", onPress: write },
      ]);
    } else {
      await write();
    }
  };

  const primaryDisabled = step === 4 ? !canSave : !canContinue;
  const primaryLabel = step === 4 ? "Save" : "Next";
  const title = step === 1 ? "Choose Field" : step === 2 ? "Add Subject" : step === 3 ? "Add Lesson" : "Add Word / Note";
  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">
      <View style={styles.header}><Ionicons name="add-circle-outline" size={22} color={colors.accentTeal} /><View><Text style={styles.headerTitle}>Create</Text><Text style={styles.headerSubtitle}>Build your knowledge structure.</Text></View></View>
      <Progress step={step} />
      <Text style={styles.title}>{step}. {title}</Text>
      <Text style={styles.subtitle}>
        {step === 1 ? "Create a field or choose one you already have." : step === 2 ? "Create a subject or use an existing one." : step === 3 ? "Create a lesson or use an existing one." : "Add a term under the selected lesson — or several with Add more?"}
      </Text>
      {step === 1 && (
        <Picker
          title="Existing fields"
          items={savedOnly(fields)}
          selectedId={fieldId}
          onSelect={(id) => {
            if (added.field.length === 0) setNewField(false);
            setFieldId(id);
            setSubjectId(null);
            setLessonId(null);
          }}
          onNew={() => { setNewField(true); setFieldId(null); }}
          onDelete={(id) => {
            deleteNode(id);
            if (fieldId === id) { setFieldId(null); setSubjectId(null); setLessonId(null); }
          }}
          onRename={(id, value) => updateNode(id, { title: value })}
          newLabel="Create new field"
        />
      )}
      {step === 1 && newField && (
        <NewLevel
          level="field"
          name={fieldName}
          setName={setFieldName}
          added={added.field}
          onAdd={addFieldEntry}
          onRemove={(index) => removeEntry("field", index)}
          onPick={(index) => pickEntry("field", index)}
          selectedId={fieldId}
          placeholder="e.g. Technology"
          icon={fieldIcon}
          setIcon={setFieldIcon}
          icons={FIELD_ICONS}
        />
      )}
      {step === 2 && (
        <>
          <Breadcrumb nodes={[selectedField]} />
          <Picker
            title="Subjects in this field"
            items={savedOnly(subjects)}
            selectedId={subjectId}
            onSelect={(id) => {
              if (added.subject.length === 0) setNewSubject(false);
              setSubjectId(id);
              setLessonId(null);
            }}
            onNew={() => { setNewSubject(true); setSubjectId(null); }}
            onDelete={(id) => {
              deleteNode(id);
              if (subjectId === id) { setSubjectId(null); setLessonId(null); }
            }}
            onRename={(id, value) => updateNode(id, { title: value })}
            newLabel="Create new subject"
            empty={added.subject.length === 0 ? "No subjects yet — create the first one." : undefined}
          />
          {newSubject && (
            <NewLevel
              level="subject"
              name={subjectName}
              setName={setSubjectName}
              added={added.subject}
              onAdd={addSubjectEntry}
              onRemove={(index) => removeEntry("subject", index)}
              onPick={(index) => pickEntry("subject", index)}
              selectedId={subjectId}
              placeholder="e.g. Programming"
              icon={subjectIcon}
              setIcon={setSubjectIcon}
              icons={SUBJECT_ICONS}
            />
          )}
        </>
      )}
      {step === 3 && (
        <>
          <Breadcrumb nodes={[selectedField, selectedSubject]} />
          <Picker
            title="Lessons in this subject"
            items={savedOnly(lessons)}
            selectedId={lessonId}
            onSelect={(id) => {
              if (added.lesson.length === 0) setNewLesson(false);
              setLessonId(id);
            }}
            onNew={() => { setNewLesson(true); setLessonId(null); }}
            onDelete={(id) => {
              deleteNode(id);
              if (lessonId === id) setLessonId(null);
            }}
            onRename={(id, value) => updateNode(id, { title: value })}
            newLabel="Create new lesson"
            empty={added.lesson.length === 0 ? "No lessons yet — create the first one." : undefined}
          />
          {newLesson && (
            <NewLevel
              level="lesson"
              name={lessonName}
              setName={setLessonName}
              added={added.lesson}
              onAdd={addLessonEntry}
              onRemove={(index) => removeEntry("lesson", index)}
              onPick={(index) => pickEntry("lesson", index)}
              selectedId={lessonId}
              placeholder="e.g. Variables and Data Types"
              icon={lessonIcon}
              setIcon={setLessonIcon}
              icons={LESSON_ICONS}
            />
          )}
        </>
      )}
      {step === 4 && (
        <>
          <Breadcrumb nodes={[selectedField, selectedSubject, selectedLesson]} />
          <View style={styles.form}>
            <Text style={styles.label}>Title / term</Text>
            <TextInput value={word} onChangeText={setWord} placeholder="e.g. Integer" placeholderTextColor={colors.textFaint} style={styles.input} autoFocus />
            <Text style={styles.label}>Content <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput value={note} onChangeText={setNote} placeholder="Write your definition, explanation, or notes..." placeholderTextColor={colors.textFaint} style={[styles.input, styles.textArea]} multiline textAlignVertical="top" maxLength={2000} />
            <Text style={styles.counter}>{note.length}/2000</Text>
            <Pressable style={[styles.aiBtn, (aiLoading || !word.trim()) && styles.disabled]} disabled={aiLoading || !word.trim()} onPress={handleAiDefinition}>
              {aiLoading ? <ActivityIndicator size="small" color={colors.accentTeal} /> : <Ionicons name="sparkles" size={16} color={colors.accentTeal} />}
              <Text style={styles.aiBtnText}>{aiLoading ? "Writing definition…" : "Generate AI Definition"}</Text>
            </Pressable>
            <AiDisclaimer compact />
            <Pressable style={[styles.addMore, styles.addMoreFull, !word.trim() && styles.disabled]} disabled={!word.trim()} onPress={addWordEntry}>
              <Ionicons name="add-circle-outline" size={16} color={colors.accentTeal} />
              <Text style={styles.addMoreText}>Add more?</Text>
            </Pressable>
            {added.word.length > 0 && (
              <View style={styles.addedList}>
                <Text style={styles.hint}>
                  {added.word.length} {added.word.length === 1 ? "term" : "terms"} added — each keeps its own description.{word.trim() ? " The term above is saved too." : ""}
                </Text>
                {added.word.map((entry, index) => (
                  <AddedTermCard
                    key={`${index}-${entry.title}`}
                    entry={entry}
                    onSave={(title, content) => updateEntry("word", index, title, content)}
                    onRemove={() => removeEntry("word", index)}
                    generate={generateTerm}
                  />
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
    <View style={styles.actions}>
      {step > 1 && <Pressable style={styles.backButton} onPress={() => setStep((value) => (value - 1) as Step)}><Text style={styles.backText}>Back</Text></Pressable>}
      {step < 4 && <Pressable style={[styles.saveButton, !canSave && styles.disabled]} disabled={!canSave} onPress={save}><Text style={styles.saveText}>Save</Text></Pressable>}
      <Pressable style={[styles.nextButton, primaryDisabled && styles.disabled]} disabled={primaryDisabled} onPress={step === 4 ? save : next}><Text style={styles.nextText}>{primaryLabel}</Text></Pressable>
    </View>
  </View>;
}

function Progress({ step }: { step: Step }) { const styles = useStyles(makeStyles); return <View style={styles.progress}>{["Field", "Subject", "Lesson", "Word"].map((label, index) => { const number = index + 1; const active = number === step; const done = number < step; return <View key={label} style={styles.progressItem}><View style={[styles.dot, (active || done) && styles.dotActive]}><Text style={[styles.dotText, (active || done) && styles.dotTextActive]}>{done ? "✓" : number}</Text></View><Text style={[styles.progressLabel, active && styles.progressLabelActive]}>{label}</Text></View>; })}</View>; }

function Picker({ title, items, selectedId, onSelect, onNew, onDelete, onRename, newLabel, empty }: { title: string; items: StrixNode[]; selectedId: string | null; onSelect: (id: string) => void; onNew: () => void; onDelete: (id: string) => void; onRename: (id: string, title: string) => void; newLabel: string; empty?: string }) { const colors = useColors(); const styles = useStyles(makeStyles); const [filter, setFilter] = useState(""); const [editing, setEditing] = useState<string | null>(null); const [draft, setDraft] = useState(""); const query = filter.trim().toLowerCase(); const visible = query ? items.filter((item) => item.title.toLowerCase().includes(query)) : items; const commit = (id: string) => { const value = draft.trim(); if (value) onRename(id, value); setEditing(null); }; return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{items.length > 3 && <View style={styles.filterRow}><Ionicons name="search" size={14} color={colors.textFaint} /><TextInput value={filter} onChangeText={setFilter} placeholder="Search..." placeholderTextColor={colors.textFaint} style={styles.filterInput} />{query.length > 0 && <Pressable onPress={() => setFilter("")}><Ionicons name="close-circle" size={14} color={colors.textFaint} /></Pressable>}</View>}{visible.map((item) => { if (editing === item.id) return <View key={item.id} style={[styles.row, styles.rowEditing]}><TextInput value={draft} onChangeText={setDraft} style={styles.editInput} placeholder="Name" placeholderTextColor={colors.textFaint} autoFocus returnKeyType="done" onSubmitEditing={() => commit(item.id)} /><Pressable hitSlop={8} disabled={!draft.trim()} onPress={() => commit(item.id)}><Ionicons name="checkmark-circle" size={20} color={draft.trim() ? colors.accentTeal : colors.textFaint} /></Pressable><Pressable hitSlop={8} onPress={() => setEditing(null)}><Ionicons name="close-circle" size={20} color={colors.textMuted} /></Pressable></View>; return <Pressable key={item.id} style={[styles.row, selectedId === item.id && styles.rowActive]} onPress={() => onSelect(item.id)} onLongPress={() => Alert.alert(`Delete ${item.title}?`, "This will also delete everything inside it.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => onDelete(item.id) }])} delayLongPress={450}><Ionicons name={(item.icon || "folder") as any} size={18} color={colors.accentTeal} /><Text style={styles.rowText}>{item.title}</Text><Pressable hitSlop={10} onPress={() => { setEditing(item.id); setDraft(item.title); }}><Ionicons name="pencil" size={15} color={colors.textMuted} /></Pressable>{selectedId === item.id && <Ionicons name="checkmark-circle" size={20} color={colors.accentTeal} />}</Pressable>; })}{items.length === 0 && empty && <Text style={styles.empty}>{empty}</Text>}{items.length > 0 && visible.length === 0 && <Text style={styles.empty}>No matches for “{filter}”.</Text>}<Pressable style={styles.newRow} onPress={onNew}><Ionicons name="add" size={18} color={colors.accentTeal} /><Text style={styles.newText}>{newLabel}</Text></Pressable></View>; }

// One name at a time plus an "Add more?" button: each press puts the name on
// the list below (and empties the box for the next one). Picking one of the
// added entries is what unlocks Continue.
function NewLevel({ level, name, setName, added, onAdd, onRemove, onPick, selectedId, placeholder, icon, setIcon, icons }: { level: BatchLevel; name: string; setName: (value: string) => void; added: AddedEntry[]; onAdd: () => void; onRemove: (index: number) => void; onPick: (index: number) => void; selectedId: string | null; placeholder: string; icon: string; setIcon: (value: string) => void; icons: readonly string[] }) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  return <View style={styles.form}>
    <Text style={styles.label}>Name</Text>
    <View style={styles.inputRow}>
      <TextInput value={name} onChangeText={setName} placeholder={placeholder} placeholderTextColor={colors.textFaint} style={styles.input} autoFocus onSubmitEditing={onAdd} />
      <Pressable style={[styles.addMore, !name.trim() && styles.disabled]} disabled={!name.trim()} onPress={onAdd}><Ionicons name="add-circle-outline" size={16} color={colors.accentTeal} /><Text style={styles.addMoreText}>Add more?</Text></Pressable>
    </View>
    {added.length > 0
      ? <View style={styles.addedList}>
        <Text style={styles.hint}>{added.length} {added.length === 1 ? "entry" : "entries"} added — tap one to pick it and continue.{name.trim() ? " The name above is saved too." : ""}</Text>
        {added.map((entry, index) => {
          const picked = selectedId === pendingId(level, index);
          return <Pressable key={`${index}-${entry.title}`} style={[styles.addedRow, picked && styles.rowActive]} onPress={() => onPick(index)}>
            <Ionicons name={picked ? "checkmark-circle" : "ellipse-outline"} size={17} color={picked ? colors.accentTeal : colors.textFaint} />
            <Text style={styles.addedText} numberOfLines={1}>{entry.title}</Text>
            <Pressable hitSlop={8} onPress={() => onRemove(index)}><Ionicons name="close-circle" size={18} color={colors.textMuted} /></Pressable>
          </Pressable>;
        })}
      </View>
      : <Text style={styles.hint}>Tip: tap Add more? to create several at once.</Text>}
    <Text style={styles.label}>Choose an icon <Text style={styles.optional}>(optional)</Text></Text>
    <View style={styles.iconGrid}>{icons.map((value) => <Pressable key={value} onPress={() => setIcon(value)} style={[styles.iconChoice, icon === value && styles.iconChoiceActive]}><Ionicons name={value as any} size={20} color={icon === value ? colors.accentTeal : colors.textMuted} /></Pressable>)}</View>
  </View>;
}

// One term on the added list. Its description travels with it: written by hand
// (pencil → inline editor) or generated (sparkles), both per term.
function AddedTermCard({ entry, onSave, onRemove, generate }: { entry: AddedEntry; onSave: (title: string, content: string) => void; onRemove: () => void; generate: (term: string) => Promise<string | null> }) {
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const startEdit = () => { setTitle(entry.title); setContent(entry.content ?? ""); setEditing(true); };
  const handleGenerate = async () => {
    const term = (editing ? title : entry.title).trim();
    if (!term || busy) return;
    const current = (editing ? content : entry.content) || "";
    const write = async () => {
      setBusy(true);
      const definition = await generate(term);
      setBusy(false);
      if (definition === null) return;
      if (editing) setContent(definition);
      else onSave(entry.title, definition);
    };
    if (current.trim()) {
      Alert.alert("Replace the description?", "The AI definition will overwrite the description on this term.", [
        { text: "Keep mine", style: "cancel" },
        { text: "Replace", onPress: write },
      ]);
    } else {
      await write();
    }
  };
  if (!editing) return <View style={styles.termCard}>
    <Text style={styles.termCardTitle}>{entry.title}</Text>
    {entry.content ? <Text style={styles.termCardPreview} numberOfLines={2}>{entry.content}</Text> : <Text style={styles.termCardEmpty}>No description yet.</Text>}
    <View style={styles.termCardActions}>
      <Pressable style={styles.termCardBtn} disabled={busy} onPress={handleGenerate}>{busy ? <ActivityIndicator size="small" color={colors.accentTeal} /> : <Ionicons name="sparkles" size={14} color={colors.accentTeal} />}<Text style={styles.termCardBtnText}>{busy ? "Writing…" : entry.content ? "Regenerate" : "AI definition"}</Text></Pressable>
      <Pressable style={styles.termCardBtn} onPress={startEdit}><Ionicons name="pencil" size={14} color={colors.linkBlue} /><Text style={[styles.termCardBtnText, { color: colors.linkBlue }]}>Edit</Text></Pressable>
      <View style={{ flex: 1 }} />
      <Pressable hitSlop={8} onPress={onRemove}><Ionicons name="close-circle" size={20} color={colors.textMuted} /></Pressable>
    </View>
  </View>;
  return <View style={[styles.termCard, styles.termCardEditing]}>
    <TextInput value={title} onChangeText={setTitle} placeholder="Term" placeholderTextColor={colors.textFaint} style={styles.termCardTitleInput} />
    <TextInput value={content} onChangeText={setContent} placeholder="Write a definition, or tap AI definition..." placeholderTextColor={colors.textFaint} style={styles.termCardContentInput} multiline textAlignVertical="top" maxLength={2000} />
    <View style={styles.termCardActions}>
      <Pressable style={styles.termCardBtn} disabled={busy || !title.trim()} onPress={handleGenerate}>{busy ? <ActivityIndicator size="small" color={colors.accentTeal} /> : <Ionicons name="sparkles" size={14} color={colors.accentTeal} />}<Text style={styles.termCardBtnText}>{busy ? "Writing…" : "AI definition"}</Text></Pressable>
      <View style={{ flex: 1 }} />
      <Pressable style={styles.termCardBtn} onPress={() => setEditing(false)}><Ionicons name="close" size={14} color={colors.textMuted} /><Text style={[styles.termCardBtnText, { color: colors.textMuted }]}>Cancel</Text></Pressable>
      <Pressable style={[styles.termCardBtn, styles.termCardSave]} disabled={!title.trim()} onPress={() => { onSave(title, content); setEditing(false); }}><Ionicons name="checkmark" size={14} color={colors.onAccent} /><Text style={[styles.termCardBtnText, { color: colors.onAccent }]}>Done</Text></Pressable>
    </View>
  </View>;
}

function Breadcrumb({ nodes }: { nodes: (StrixNode | undefined)[] }) { const styles = useStyles(makeStyles); return <View style={styles.breadcrumb}><Text style={styles.breadcrumbText}>{nodes.filter(Boolean).map((node) => node!.title).join("  ›  ")}</Text></View>; }

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, paddingTop: 42, paddingBottom: 120 }, header: { flexDirection: "row", gap: 10, alignItems: "center", paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: colors.border }, headerTitle: { color: colors.text, fontSize: 18, fontWeight: "700" }, headerSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 }, progress: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 24 }, progressItem: { flex: 1, alignItems: "center", gap: 6 }, dot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, dotActive: { backgroundColor: colors.accentTeal, borderColor: colors.accentTeal }, dotText: { color: colors.textFaint, fontSize: 12, fontWeight: "700" }, dotTextActive: { color: colors.onAccent }, progressLabel: { color: colors.textFaint, fontSize: 11 }, progressLabelActive: { color: colors.accentTeal, fontWeight: "700" }, title: { color: colors.text, fontSize: 18, fontWeight: "700" }, subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 5 }, section: { marginTop: 24, gap: 9 }, sectionTitle: { color: colors.text, fontWeight: "600", fontSize: 13, marginBottom: 2 }, filterRow: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 4 }, filterInput: { flex: 1, color: colors.text, fontSize: 13 }, row: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 13 }, rowActive: { borderColor: colors.accentTeal, backgroundColor: colors.highlight }, rowEditing: { borderColor: colors.accentTeal, paddingVertical: 8, paddingHorizontal: 12 }, rowText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" }, editInput: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" }, newRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.accentTeal }, newText: { color: colors.accentTeal, fontWeight: "700", fontSize: 13 }, empty: { color: colors.textFaint, fontSize: 12, paddingVertical: 7 }, form: { marginTop: 20, gap: 10 }, label: { color: colors.text, fontSize: 13, fontWeight: "600", marginTop: 4 }, optional: { color: colors.textFaint, fontWeight: "400" }, input: { color: colors.text, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 }, inputRow: { flexDirection: "row", alignItems: "center", gap: 8 }, addMore: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 13, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: colors.accentTeal, backgroundColor: colors.surface }, addMoreFull: { alignSelf: "stretch", marginTop: 4 }, addMoreText: { color: colors.accentTeal, fontWeight: "700", fontSize: 13 }, addedList: { gap: 8, marginTop: 2 }, addedRow: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 }, addedText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "600" }, hint: { color: colors.textFaint, fontSize: 11, lineHeight: 16, marginTop: -4 }, textArea: { minHeight: 150 }, counter: { color: colors.textFaint, fontSize: 11, textAlign: "right" }, aiBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.accentTeal, paddingVertical: 13 }, aiBtnText: { color: colors.accentTeal, fontWeight: "700", fontSize: 13 }, termCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 6 }, termCardEditing: { borderColor: colors.accentTeal }, termCardTitle: { color: colors.text, fontSize: 13, fontWeight: "700" }, termCardPreview: { color: colors.textMuted, fontSize: 12, lineHeight: 17 }, termCardEmpty: { color: colors.textFaint, fontSize: 12, fontStyle: "italic" }, termCardActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }, termCardBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: colors.chip }, termCardBtnText: { color: colors.accentTeal, fontSize: 11, fontWeight: "700" }, termCardSave: { backgroundColor: colors.accentTeal }, termCardTitleInput: { color: colors.text, fontSize: 13, fontWeight: "700", backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 }, termCardContentInput: { color: colors.text, fontSize: 12, lineHeight: 17, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8, minHeight: 90, textAlignVertical: "top" }, iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, iconChoice: { width: 45, height: 45, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, iconChoiceActive: { borderColor: colors.accentTeal, backgroundColor: colors.iconWell }, breadcrumb: { backgroundColor: colors.note, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 12, padding: 13, marginTop: 24 }, breadcrumbText: { color: colors.accentBlue, fontSize: 12 }, actions: { flexDirection: "row", gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background }, backButton: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, backText: { color: colors.textMuted, fontWeight: "700" }, saveButton: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.accentTeal, alignItems: "center", justifyContent: "center" }, saveText: { color: colors.accentText, fontWeight: "700" }, nextButton: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: colors.accentTeal, alignItems: "center", justifyContent: "center" }, disabled: { opacity: 0.45 }, nextText: { color: colors.onAccent, fontWeight: "800" },
});
