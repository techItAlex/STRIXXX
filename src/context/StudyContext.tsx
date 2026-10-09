import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type StudyMode = "focus" | "shortBreak" | "longBreak";

export interface StudySession {
  id: string;
  topicId: string;
  plannedSeconds: number;
  focusedSeconds: number;
  pausedSeconds: number;
  breakSeconds: number;
  pauseCount: number;
  startedAt: number;
  endedAt: number;
  completed: boolean;
  analysis?: string;
}

interface StudyContextValue {
  sessions: StudySession[];
  loading: boolean;
  saveSession: (session: StudySession) => void;
  updateSession: (id: string, patch: Partial<StudySession>) => void;
  sessionsForTopic: (topicId: string) => StudySession[];
}

const STORAGE_KEY = "strix:study-sessions:v1";
const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw && setSessions(JSON.parse(raw)))
      // Fixed messages only: JSON parse errors can embed stored text.
      .catch(() => console.warn("STRIX: could not load study sessions"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)).catch(() =>
        console.warn("STRIX: failed to save study sessions")
      );
    }
  }, [sessions, loading]);

  const value = useMemo<StudyContextValue>(() => ({
    sessions,
    loading,
    saveSession: (session) => setSessions((previous) => [session, ...previous]),
    updateSession: (id, patch) => setSessions((previous) => previous.map((session) =>
      session.id === id ? { ...session, ...patch } : session
    )),
    sessionsForTopic: (topicId) => sessions.filter((session) => session.topicId === topicId),
  }), [sessions, loading]);

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error("useStudy must be used within a StudyProvider");
  return context;
}
