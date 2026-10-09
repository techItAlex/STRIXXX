import React, { useState } from "react";
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
import { useApiKey } from "../../context/ApiKeyContext";
import { useAiConversations } from "../../context/AiConversationContext";
import { judgeUnderstanding } from "../../services/ai/aiService";
import { AiServiceError, JudgeResult } from "../../services/ai/types";
import { AiDisclaimer } from "../../components/AiDisclaimer";

interface Entry {
  id: string;
  term: string;
  understanding: string;
  result?: JudgeResult;
  error?: string;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const verdictMeta = (colors: Colors): Record<
  JudgeResult["verdict"],
  { label: string; color: string; icon: any }
> => ({
  good: { label: "Good understanding!", color: colors.accentText, icon: "checkmark-circle" },
  needs_work: { label: "Getting there", color: colors.accentOrange, icon: "alert-circle" },
  incorrect: { label: "Let's fix this", color: colors.accentRed, icon: "close-circle" },
});

export default function JudgeUnderstandingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { conversationId: initialConversationId } = route.params ?? {};

  const { apiKey } = useApiKey();
  const { createConversation, appendMessages, getConversation } =
    useAiConversations();

  const existing = initialConversationId ? getConversation(initialConversationId) : undefined;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [term, setTerm] = useState("");
  const [understanding, setUnderstanding] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null
  );
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const vmeta = verdictMeta(colors);

  const canSubmit = term.trim() && understanding.trim() && !submitting;

  const handleCheck = async () => {
    if (!canSubmit) return;
    const entryId = uid();
    const t = term.trim();
    const u = understanding.trim();
    setEntries((prev) => [...prev, { id: entryId, term: t, understanding: u }]);
    setTerm("");
    setUnderstanding("");
    setSubmitting(true);

    const convoId =
      conversationId ??
      (() => {
        const c = createConversation("judge", `${t} Check`);
        setConversationId(c.id);
        return c.id;
      })();

    appendMessages(convoId, [
      { id: uid(), role: "user", text: `${t}: ${u}`, createdAt: Date.now() },
    ]);

    try {
      const result = await judgeUnderstanding({ apiKey, term: t, understanding: u });
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, result } : e))
      );
      appendMessages(convoId, [
        {
          id: uid(),
          role: "assistant",
          text: `${vmeta[result.verdict].label}: ${result.feedback}`,
          createdAt: Date.now(),
        },
      ]);
    } catch (e) {
      const message =
        e instanceof AiServiceError ? e.message : "Something went wrong. Try again.";
      setEntries((prev) => (prev.map((en) => (en.id === entryId ? { ...en, error: message } : en))));
    } finally {
      setSubmitting(false);
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
          <Ionicons name="bulb" size={16} color={colors.onAccent} />
        </View>
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text style={styles.headerTitle}>AI Companion</Text>
          <Text style={styles.headerSubtitle}>Judge my understanding</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 20 }}>
        <View style={styles.chip}>
          <Ionicons name="school" size={12} color={colors.accentText} />
          <Text style={styles.chipText}>Check your understanding</Text>
        </View>

        {entries.length === 0 && (
          <Text style={styles.emptyText}>
            Pick a term you've learned, write your own explanation, and see how
            complete it is.
          </Text>
        )}

        {entries.map((entry) => (
          <View key={entry.id} style={{ gap: 10 }}>
            <View style={styles.submissionCard}>
              <View style={styles.submissionHeader}>
                <Text style={styles.submissionTerm}>{entry.term}</Text>
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={12} color={colors.onAccent} />
                </View>
              </View>
              <Text style={styles.submissionLabel}>My understanding:</Text>
              <Text style={styles.submissionText}>{entry.understanding}</Text>
            </View>

            {entry.result && (
              <View
                style={[
                  styles.resultCard,
                  { borderColor: vmeta[entry.result.verdict].color },
                ]}
              >
                <View style={styles.resultHeader}>
                  <Ionicons
                    name={vmeta[entry.result.verdict].icon}
                    size={16}
                    color={vmeta[entry.result.verdict].color}
                  />
                  <Text
                    style={[
                      styles.resultVerdict,
                      { color: vmeta[entry.result.verdict].color },
                    ]}
                  >
                    {vmeta[entry.result.verdict].label}
                  </Text>
                </View>
                <Text style={styles.resultFeedback}>{entry.result.feedback}</Text>

                {!!entry.result.betterExplanation && (
                  <View style={styles.betterBox}>
                    <Text style={styles.betterText}>
                      "{entry.result.betterExplanation}"
                    </Text>
                  </View>
                )}

                {entry.result.keyPoints.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.keyPointsLabel}>Key points you can add:</Text>
                    {entry.result.keyPoints.map((kp, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>•</Text>
                        <Text style={styles.bulletText}>{kp}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {entry.error && (
              <View style={[styles.resultCard, { borderColor: colors.accentRed }]}>
                <Text style={{ color: colors.accentRed, fontSize: 12 }}>
                  {entry.error}
                </Text>
              </View>
            )}
          </View>
        ))}

        {submitting && (
          <View style={[styles.resultCard, { alignItems: "center" }]}>
            <ActivityIndicator size="small" color={colors.textMuted} />
          </View>
        )}
      </ScrollView>

      <AiDisclaimer style={{ marginHorizontal: 14, marginBottom: 8 }} />

      <View style={styles.formBar}>
        <TextInput
          value={term}
          onChangeText={setTerm}
          placeholder="Term (e.g. Photosynthesis)"
          placeholderTextColor={colors.textFaint}
          style={styles.termInput}
        />
        <View style={styles.understandingRow}>
          <TextInput
            value={understanding}
            onChangeText={setUnderstanding}
            placeholder="Enter a word and your definition..."
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, !canSubmit && { opacity: 0.4 }]}
            onPress={handleCheck}
            disabled={!canSubmit}
          >
            <Ionicons name="send" size={16} color={colors.onAccent} />
          </Pressable>
        </View>
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
    backgroundColor: colors.accentBlue,
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
  emptyText: { color: colors.textFaint, fontSize: 13, textAlign: "center", marginTop: 20 },
  submissionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  submissionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  submissionTerm: { color: colors.text, fontWeight: "700", fontSize: 15 },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  submissionLabel: { color: colors.textFaint, fontSize: 11, fontWeight: "600" },
  submissionText: { color: colors.textMuted, fontSize: 13, marginTop: 4, lineHeight: 19 },
  resultCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  resultVerdict: { fontWeight: "700", fontSize: 13 },
  resultFeedback: { color: colors.text, fontSize: 13, lineHeight: 19 },
  betterBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  betterText: { color: colors.textMuted, fontSize: 12, fontStyle: "italic", lineHeight: 18 },
  keyPointsLabel: { color: colors.text, fontWeight: "700", fontSize: 12, marginBottom: 6 },
  bulletRow: { flexDirection: "row", gap: 6, marginBottom: 3 },
  bulletDot: { color: colors.accentText, fontSize: 13 },
  bulletText: { color: colors.textMuted, fontSize: 12, flex: 1, lineHeight: 18 },
  formBar: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: 8,
  },
  termInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 13,
  },
  understandingRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
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
