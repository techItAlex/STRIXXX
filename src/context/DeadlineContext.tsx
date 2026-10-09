import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sanitizeText } from "../services/ai/sanitize";

export type Deadline = {
  id: string;
  title: string;
  dueAt: string;
  course?: string;
  nodeId?: string;
  notes?: string;
  status: "open" | "done";
  reminderIds: string[];
  source: "manual" | "ai" | "classroom";
};
type DeadlineDraft = Omit<Deadline, "id"> & { id?: string };
type DeadlineContextValue = { deadlines: Deadline[]; loading: boolean; saveDeadline(draft: DeadlineDraft): Deadline; deleteDeadline(id: string): void; toggleDone(id: string): void };
const STORAGE_KEY = "strix_deadlines";
const Context = createContext<DeadlineContextValue | null>(null);
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function DeadlineProvider({ children }: { children: React.ReactNode }) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => { if (raw) setDeadlines(JSON.parse(raw)); }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!loading) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(deadlines)).catch(() => {});
  }, [deadlines, loading]);
  const value = useMemo<DeadlineContextValue>(() => ({
    deadlines,
    loading,
    saveDeadline(draft) {
      const item: Deadline = {
        id: draft.id ?? uid(),
        title: sanitizeText(draft.title, 200),
        dueAt: draft.dueAt,
        course: sanitizeText(draft.course, 100) || undefined,
        nodeId: sanitizeText(draft.nodeId, 100) || undefined,
        notes: sanitizeText(draft.notes, 1000) || undefined,
        status: draft.status,
        reminderIds: draft.reminderIds ?? [],
        source: draft.source,
      };
      setDeadlines((current) => current.some((entry) => entry.id === item.id) ? current.map((entry) => entry.id === item.id ? item : entry) : [...current, item]);
      return item;
    },
    deleteDeadline(id) { setDeadlines((current) => current.filter((entry) => entry.id !== id)); },
    toggleDone(id) { setDeadlines((current) => current.map((entry) => entry.id === id ? { ...entry, status: entry.status === "open" ? "done" : "open" } : entry)); },
  }), [deadlines, loading]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useDeadlines() { const value = useContext(Context); if (!value) throw new Error("useDeadlines must be used inside DeadlineProvider"); return value; }
