import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useColors } from "../context/ThemeContext";
import { useDeadlines, Deadline } from "../context/DeadlineContext";
import { parseDeadlineList, parseDeadlineText, ParsedDeadline } from "../services/ai/aiService";

const palette = ["#35C9B6", "#6D9EFF", "#D08AFF", "#F3AA4A", "#EA7189", "#88B85A"];
function keyOf(date: Date) { return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0"); }
function dayOf(value: string) { const d = new Date(value); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function colorFor(label?: string) { let hash = 0; for (const c of label || "General") hash = (hash * 31 + c.charCodeAt(0)) | 0; return palette[Math.abs(hash) % palette.length]; }
function makeIso(day: string, time: string) { return new Date(day + "T" + (time || "09:00") + ":00").toISOString(); }
type Draft = { title: string; date: string; time: string; course: string; notes: string; id?: string; source: Deadline["source"] };

export default function CalendarScreen() {
  const nav = useNavigation<any>(), colors = useColors();
  const { deadlines, saveDeadline, deleteDeadline, toggleDone } = useDeadlines();
  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(keyOf(new Date()));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [quick, setQuick] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const [agendaMode, setAgendaMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(month.getFullYear(), month.getMonth(), 1 - new Date(month.getFullYear(), month.getMonth(), 1).getDay() + i); return d; });
  const items = deadlines.filter((d) => keyOf(dayOf(d.dueAt)) === selected).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const upcoming = deadlines.filter((d) => d.status === "open").sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const openForm = (item?: Deadline) => {
    if (!item) { setDraft({ title: "", date: selected, time: "09:00", course: "", notes: "", source: "manual" }); return; }
    const date = new Date(item.dueAt);
    setDraft({ id: item.id, title: item.title, date: keyOf(date), time: String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0"), course: item.course || "", notes: item.notes || "", source: item.source });
  };
  const save = () => {
    if (!draft || !draft.title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || !/^\d{2}:\d{2}$/.test(draft.time)) { Alert.alert("Check deadline", "Enter a title, YYYY-MM-DD date, and HH:MM time."); return; }
    saveDeadline({ id: draft.id, title: draft.title, dueAt: makeIso(draft.date, draft.time), course: draft.course, notes: draft.notes, status: draft.id ? deadlines.find((d) => d.id === draft.id)?.status || "open" : "open", reminderIds: [], source: draft.source });
    setSelected(draft.date); setDraft(null);
  };
  const review = (list: ParsedDeadline[], i = 0) => {
    if (i >= list.length) return;
    const d = list[i];
    Alert.alert("Review deadline", d.title + "\n" + d.date + (d.time ? " at " + d.time : " (no time)") + (d.course ? "\n" + d.course : ""), [
      { text: "Skip", style: "cancel", onPress: () => review(list, i + 1) },
      { text: "Add", onPress: () => { saveDeadline({ title: d.title, dueAt: makeIso(d.date, d.time || "09:00"), course: d.course || undefined, status: "open", reminderIds: [], source: "ai" }); setSelected(d.date); review(list, i + 1); } },
    ]);
  };
  const parse = async (list: boolean) => {
    if (!quick.trim() || busy) return;
    setBusy(true);
    try {
      const results = list ? await parseDeadlineList(quick) : [await parseDeadlineText(quick, keyOf(new Date()), "Asia/Manila")];
      setQuick(""); setQuickOpen(false); if (results.length) review(results); else Alert.alert("No deadlines found", "Add one manually instead.");
    } catch (err) {
      const value = quick;
      setQuickOpen(false);
      Alert.alert("Could not parse", (err instanceof Error ? err.message : "Try the manual form.") + "\nOpen a manual form?", [
        { text: "Cancel", style: "cancel" }, { text: "Manual form", onPress: () => { setSelected(keyOf(new Date())); setDraft({ title: value.slice(0, 200), date: keyOf(new Date()), time: "09:00", course: "", notes: "", source: "manual" }); } },
      ]);
    } finally { setBusy(false); }
  };
  return <View style={[s.screen, { backgroundColor: colors.background }]}>
    <View style={s.header}><Pressable onPress={() => nav.goBack()}><Text style={{ color: colors.accentText }}>‹ Back</Text></Pressable><Text style={[s.title, { color: colors.text }]}>Calendar</Text><Pressable onPress={() => setQuickOpen((value) => !value)}><Text style={{ color: colors.accentText }}>Quick add</Text></Pressable></View>
    {quickOpen && <View style={[s.quickBox, { backgroundColor: colors.surface }]}><TextInput value={quick} onChangeText={setQuick} multiline placeholder="Describe a deadline or paste a task list" style={[s.quickInput, { color: colors.text, borderColor: colors.border }]} /><View style={s.row}><Pressable onPress={() => { setQuickOpen(false); openForm(); }}><Text style={{ color: colors.textMuted }}>Manual</Text></Pressable><Pressable disabled={busy} onPress={() => parse(false)}><Text style={{ color: colors.accentTeal }}>{busy ? "Reading…" : "Parse one"}</Text></Pressable><Pressable disabled={busy} onPress={() => parse(true)}><Text style={{ color: colors.accentTeal }}>Paste list</Text></Pressable></View></View>}
    <View style={s.row}><Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Text style={{ color: colors.text }}>‹</Text></Pressable><Text style={[s.month, { color: colors.text }]}>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text><Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Text style={{ color: colors.text }}>›</Text></Pressable><Pressable onPress={() => { setMonth(new Date()); setSelected(keyOf(new Date())); }}><Text style={{ color: colors.accentText }}>Today</Text></Pressable></View>
    <View style={s.grid}>{["S","M","T","W","T","F","S"].map((d, i) => <Text key={d + i} style={[s.weekday, { color: colors.textFaint }]}>{d}</Text>)}
      {cells.map((date, i) => { const key = keyOf(date), dayItems = deadlines.filter((d) => keyOf(dayOf(d.dueAt)) === key); const tints = ["transparent", colors.accentTeal + "12", colors.accentTeal + "1C", colors.accentTeal + "26"]; return <Pressable key={i} accessibilityLabel={date.toLocaleDateString() + ", " + dayItems.length + " deadlines"} onPress={() => setSelected(key)} style={[s.cell, { borderColor: key === selected ? colors.accentTeal : "transparent", opacity: date.getMonth() === month.getMonth() ? 1 : 0.35, backgroundColor: tints[Math.min(dayItems.length, 3)] }]}><Text style={{ color: key === keyOf(new Date()) ? colors.accentOrange : colors.text }}>{date.getDate()}</Text><View style={s.dots}>{dayItems.slice(0, 3).map((d) => <View key={d.id} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: d.status === "done" ? colors.textFaint : new Date(d.dueAt).getTime() < Date.now() ? colors.accentRed : colorFor(d.course) }} />)}{dayItems.length > 3 && <Text style={{ color: colors.textFaint, fontSize: 8 }}>+{dayItems.length - 3}</Text>}</View></Pressable>; })}
    </View>
    <View style={s.row}><Text style={[s.agenda, { color: colors.text }]}>{agendaMode ? "Upcoming deadlines" : new Date(selected + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</Text><Pressable onPress={() => setAgendaMode((value) => !value)}><Text style={{ color: colors.accentTeal }}>{agendaMode ? "Day" : "Agenda"}</Text></Pressable><Pressable onPress={() => openForm()}><Text style={{ color: colors.accentTeal }}>+ Add</Text></Pressable></View>
    <ScrollView contentContainerStyle={{ gap: 8 }}>{agendaMode ? (["Overdue", "Today", "Tomorrow", "This week", "Later"] as const).map((group) => { const now = new Date(), tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), endWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7); const groupItems = upcoming.filter((d) => { const at = new Date(d.dueAt), key = keyOf(dayOf(d.dueAt)); if (at < now) return group === "Overdue"; if (key === keyOf(now)) return group === "Today"; if (key === keyOf(tomorrow)) return group === "Tomorrow"; if (at < endWeek) return group === "This week"; return group === "Later"; }); return groupItems.length ? <View key={group}><Text style={{ color: colors.textMuted, fontWeight: "700", marginTop: 8 }}>{group}</Text>{groupItems.map((d) => <DeadlineRow key={d.id} item={d} colors={colors} onEdit={() => openForm(d)} onDone={() => toggleDone(d.id)} onDelete={() => deleteDeadline(d.id)} />)}</View> : null; }) : items.map((d) => <DeadlineRow key={d.id} item={d} colors={colors} onEdit={() => openForm(d)} onDone={() => toggleDone(d.id)} onDelete={() => deleteDeadline(d.id)} />)}</ScrollView>
    {draft && <View style={[s.form, { backgroundColor: colors.surface }]}><Text style={[s.title, { color: colors.text }]}>{draft.id ? "Edit deadline" : "New deadline"}</Text>{(["title","date","time","course","notes"] as const).map((field) => <TextInput key={field} value={draft[field]} onChangeText={(v) => setDraft((d) => d ? { ...d, [field]: v } : d)} placeholder={field === "date" ? "YYYY-MM-DD" : field === "time" ? "HH:MM" : field} placeholderTextColor={colors.textFaint} style={[s.input, { color: colors.text, borderColor: colors.border }]} />)}<View style={s.row}><Pressable onPress={() => setDraft(null)}><Text style={{ color: colors.textMuted }}>Cancel</Text></Pressable><Pressable onPress={save}><Text style={{ color: colors.accentTeal }}>Save</Text></Pressable></View></View>}
  </View>;
}
function DeadlineRow({ item, colors, onEdit, onDone, onDelete }: { item: Deadline; colors: ReturnType<typeof useColors>; onEdit: () => void; onDone: () => void; onDelete: () => void }) {
  const delta = new Date(item.dueAt).getTime() - Date.now();
  const countdown = delta < 0 ? Math.floor(-delta / 3600000) + " h overdue" : Math.ceil(delta / 86400000) + " days";
  return <Pressable onPress={onEdit} onLongPress={onDone} style={[s.item, { backgroundColor: colors.surface, borderLeftColor: colorFor(item.course), opacity: item.status === "done" ? 0.5 : 1 }]}><View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: "700" }}>{item.title}</Text><Text style={{ color: colors.textMuted }}>{item.course || "General"} · {new Date(item.dueAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {countdown}</Text></View><Pressable onPress={onDone}><Text style={{ color: colors.accentTeal }}>Done</Text></Pressable><Pressable onPress={() => Alert.alert("Delete deadline?", item.title, [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: onDelete }])}><Text style={{ color: colors.accentRed, marginLeft: 8 }}>×</Text></Pressable></Pressable>;
}
const s = StyleSheet.create({ screen: { flex: 1, padding: 16, paddingTop: 48 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }, title: { fontSize: 20, fontWeight: "800" }, row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginVertical: 8 }, month: { fontSize: 17, fontWeight: "700" }, grid: { flexDirection: "row", flexWrap: "wrap" }, weekday: { width: "14.2857%", textAlign: "center", padding: 5 }, cell: { width: "14.2857%", height: 46, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 8 }, dots: { flexDirection: "row", height: 7, gap: 2, marginTop: 2 }, agenda: { fontSize: 16, fontWeight: "700" }, item: { borderLeftWidth: 4, padding: 12, borderRadius: 10, flexDirection: "row", alignItems: "center" }, input: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: 8, padding: 10 }, quickBox: { backgroundColor: "#17202E", borderRadius: 12, padding: 12 }, quickInput: { minHeight: 90, borderWidth: 1, borderRadius: 8, padding: 10, textAlignVertical: "top" }, form: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#17202E", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 8 } });
