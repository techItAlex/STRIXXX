import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatMessage } from "../services/ai/types";

const STORAGE_KEY = "strix:ai:conversations:v1";

export type ConversationMode = "discuss" | "judge" | "organize";

export interface AiConversation {
  id: string;
  mode: ConversationMode;
  title: string;
  messages: ChatMessage[];
  contextNodeId?: string;
  createdAt: number;
  updatedAt: number;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface AiConversationContextValue {
  conversations: AiConversation[];
  loading: boolean;
  createConversation: (
    mode: ConversationMode,
    title: string,
    contextNodeId?: string
  ) => AiConversation;
  appendMessages: (id: string, messages: ChatMessage[]) => void;
  renameConversation: (id: string, title: string) => void;
  getConversation: (id: string) => AiConversation | undefined;
  recentConversations: (limit?: number) => AiConversation[];
}

const AiConversationContext = createContext<AiConversationContextValue | null>(
  null
);

export function AiConversationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setConversations(JSON.parse(raw));
      } catch {
        // Fixed message only: JSON parse errors can embed chat/note text,
        // which must never reach console output.
        console.warn("STRIX: could not load AI conversations");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conversations)).catch(() =>
        console.warn("STRIX: failed to save AI conversations")
    );
  }, [conversations, loading]);

  const value = useMemo<AiConversationContextValue>(() => {
    const getConversation = (id: string) =>
      conversations.find((c) => c.id === id);

    const createConversation = (
      mode: ConversationMode,
      title: string,
      contextNodeId?: string
    ) => {
      const now = Date.now();
      const convo: AiConversation = {
        id: uid(),
        mode,
        title,
        messages: [],
        contextNodeId,
        createdAt: now,
        updatedAt: now,
      };
      setConversations((prev) => [...prev, convo]);
      return convo;
    };

    const appendMessages = (id: string, messages: ChatMessage[]) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, messages: [...c.messages, ...messages], updatedAt: Date.now() }
            : c
        )
      );
    };

    const renameConversation = (id: string, title: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    };

    const recentConversations = (limit = 5) =>
      [...conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);

    return {
      conversations,
      loading,
      createConversation,
      appendMessages,
      renameConversation,
      getConversation,
      recentConversations,
    };
  }, [conversations, loading]);

  return (
    <AiConversationContext.Provider value={value}>
      {children}
    </AiConversationContext.Provider>
  );
}

export function useAiConversations() {
  const ctx = useContext(AiConversationContext);
  if (!ctx)
    throw new Error(
      "useAiConversations must be used within an AiConversationProvider"
    );
  return ctx;
}
