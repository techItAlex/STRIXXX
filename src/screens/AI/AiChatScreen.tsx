import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useColors } from "../../context/ThemeContext";
import { useStyles } from "../../theme/useStyles";
import type { Colors } from "../../theme/colors";
import { useNodes } from "../../context/NodeContext";
import { useApiKey } from "../../context/ApiKeyContext";
import { useAiConversations } from "../../context/AiConversationContext";
import { askAboutNotes, retrieveRelevantNodes } from "../../services/ai/aiService";
import { AiServiceError, ChatMessage } from "../../services/ai/types";
import { AiDisclaimer } from "../../components/AiDisclaimer";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function AiChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { conversationId: initialConversationId, contextNodeId } = route.params ?? {};

  const { nodes, getPath, getNode } = useNodes();
  const { apiKey } = useApiKey();
  const { createConversation, appendMessages, getConversation } =
    useAiConversations();

  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null
  );
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialConversationId ? getConversation(initialConversationId)?.messages ?? [] : []
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const colors = useColors();
  const styles = useStyles(makeStyles);

  const contextNode = contextNodeId ? getNode(contextNodeId) : undefined;
  const contextLabel = contextNode
    ? getPath(contextNode.id)
        .map((n) => n.title)
        .join(" > ")
    : undefined;

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages]);

  const ensureConversation = (firstMessageText: string) => {
    if (conversationId) return conversationId;
    const title =
      firstMessageText.length > 40
        ? firstMessageText.slice(0, 40).trim() + "…"
        : firstMessageText;
    const convo = createConversation("discuss", title, contextNodeId);
    setConversationId(convo.id);
    return convo.id;
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || sending) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      text: question,
      createdAt: Date.now(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    const convoId = ensureConversation(question);
    appendMessages(convoId, [userMsg]);

    setSending(true);
    try {
      const matches = retrieveRelevantNodes(question, nodes, getPath);
      const replyText = await askAboutNotes({
        apiKey,
        question,
        history: nextMessages,
        matches,
        currentContextLabel: contextLabel,
      });

      const topMatch = matches[0];
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        text: replyText,
        createdAt: Date.now(),
        usedNotes: matches.length > 0,
        relatedNote:
          topMatch && topMatch.score >= 3
            ? {
                nodeId: topMatch.node.id,
                title: topMatch.node.title,
                pathLabel: topMatch.pathLabel,
              }
            : undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      appendMessages(convoId, [assistantMsg]);
    } catch (e) {
      const errMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        text:
          e instanceof AiServiceError
            ? e.message
            : "The response could not be generated. Check your AI mode and try again.",
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerIcon}>
          <Ionicons name="chatbubbles" size={16} color={colors.onAccent} />
        </View>
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text style={styles.headerTitle}>AI Companion</Text>
          <Text style={styles.headerSubtitle}>Discuss my notes</Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 20 }}
      >
        <View style={styles.chip}>
          <Ionicons name="sparkles" size={12} color={colors.accentText} />
          <Text style={styles.chipText}>Using your notes</Text>
        </View>

        {messages.length === 0 && (
          <Text style={styles.emptyText}>
            Ask about anything you've saved — or anything you're learning.
          </Text>
        )}

        {messages.map((m) => (
          <View key={m.id}>
            <View
              style={[
                styles.bubbleRow,
                m.role === "user" && { justifyContent: "flex-end" },
              ]}
            >
              {m.role === "assistant" && (
                <View style={styles.botAvatar}>
                  <Ionicons name="sparkles" size={12} color={colors.onAccent} />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  m.role === "user" ? styles.bubbleUser : styles.bubbleBot,
                ]}
              >
                <Text
                  style={
                    m.role === "user" ? styles.bubbleTextUser : styles.bubbleTextBot
                  }
                >
                  {m.text}
                </Text>
              </View>
              {m.role === "user" && (
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={12} color={colors.onAccent} />
                </View>
              )}
            </View>

            {m.relatedNote && (
              <Pressable
                style={styles.relatedCard}
                onPress={() =>
                  navigation.navigate("NodeDetail", { nodeId: m.relatedNote!.nodeId })
                }
              >
                <View style={styles.relatedIcon}>
                  <Ionicons name="document-text" size={14} color={colors.onAccent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.relatedLabel}>Related note</Text>
                  <Text style={styles.relatedTitle}>{m.relatedNote.title}</Text>
                  {!!m.relatedNote.pathLabel && (
                    <Text style={styles.relatedMeta}>{m.relatedNote.pathLabel}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
              </Pressable>
            )}
          </View>
        ))}

        {sending && (
          <View style={styles.bubbleRow}>
            <View style={styles.botAvatar}>
              <Ionicons name="sparkles" size={12} color={colors.onAccent} />
            </View>
            <View style={[styles.bubble, styles.bubbleBot]}>
              <ActivityIndicator size="small" color={colors.textMuted} />
            </View>
          </View>
        )}
      </ScrollView>

      <AiDisclaimer style={{ marginHorizontal: 14, marginBottom: 8 }} />

      <View style={styles.inputBar}>
        <Ionicons name="attach" size={18} color={colors.textFaint} />
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask a question..."
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          multiline
        />
        <Pressable
          style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <Ionicons name="send" size={16} color={colors.onAccent} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: colors.accentPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  headerSubtitle: { color: colors.textMuted, fontSize: 11 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { color: colors.accentText, fontSize: 11, fontWeight: "600" },
  emptyText: { color: colors.textFaint, fontSize: 13, textAlign: "center", marginTop: 40 },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  botAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accentBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accentPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: { maxWidth: "75%", borderRadius: 16, padding: 12 },
  bubbleBot: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bubbleUser: { backgroundColor: colors.accentBlue },
  bubbleTextBot: { color: colors.text, fontSize: 13, lineHeight: 20 },
  bubbleTextUser: { color: colors.onAccent, fontSize: 13, lineHeight: 20 },
  relatedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.callout,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginLeft: 34,
  },
  relatedIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  relatedLabel: { color: colors.accentText, fontSize: 10, fontWeight: "700" },
  relatedTitle: { color: colors.text, fontSize: 13, fontWeight: "600", marginTop: 1 },
  relatedMeta: { color: colors.textFaint, fontSize: 10, marginTop: 1 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 13,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
  },
});
