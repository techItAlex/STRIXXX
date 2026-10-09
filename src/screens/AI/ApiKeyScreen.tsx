import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useColors } from "../../context/ThemeContext";
import { useStyles } from "../../theme/useStyles";
import type { Colors } from "../../theme/colors";
import { useApiKey } from "../../context/ApiKeyContext";
import { looksLikeApiKey, normalizeApiKey } from "../../services/ai/sanitize";

export default function ApiKeyScreen() {
  const navigation = useNavigation<any>();
  const { apiKey, setApiKey, clearApiKey, hasKey } = useApiKey();
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const [value, setValue] = useState(apiKey ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (next: string) => {
    setValue(next);
    if (error) setError(null);
  };

  const handleSave = async () => {
    const clean = normalizeApiKey(value);
    if (!clean) return;
    // Reject obvious junk early (URLs, pasted sentences) so a broken key
    // never gets stored — the value itself is never logged or echoed back.
    if (!looksLikeApiKey(clean)) {
      setError(
        "That doesn't look like a Gemini API key. Paste the full key from Google AI Studio — no spaces."
      );
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await setApiKey(clean);
      navigation.goBack();
    } catch {
      setError("Couldn't save the key — check your device security settings and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    Alert.alert("Remove API key?", "Cloud AI will need a key again. Local AI remains available.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await clearApiKey();
          setValue("");
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Optional cloud (Gemini)</Text>
          <Text style={styles.headerSubtitle}>A key is optional. Local AI does not need one.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Ionicons name="key" size={18} color={colors.accentText} />
        <Text style={styles.cardText}>
          When cloud mode is selected, your key talks directly to
          Google's Gemini API from your phone. Nothing is shared with anyone
          else, and there's a free tier for personal use.
        </Text>
      </View>

      <Text style={styles.label}>Gemini API Key</Text>
      <TextInput
        value={value}
        onChangeText={handleChange}
        placeholder="Paste your Gemini API key"
        placeholderTextColor={colors.textFaint}
        style={[styles.input, error && styles.inputError]}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable
        onPress={() => Linking.openURL("https://aistudio.google.com/apikey")}
      >
        <Text style={styles.link}>Get a free key from Google AI Studio ↗</Text>
      </Pressable>

      <Pressable
        style={[styles.saveBtn, !value.trim() && { opacity: 0.5 }]}
        disabled={!value.trim() || saving}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Key"}</Text>
      </Pressable>

      {hasKey && (
        <Pressable style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.clearBtnText}>Remove saved key</Text>
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: 44, paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  headerSubtitle: { color: colors.textMuted, fontSize: 12 },
  card: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  cardText: { flex: 1, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  label: { color: colors.text, fontWeight: "700", marginBottom: 8, fontSize: 13 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    color: colors.text,
    fontSize: 14,
  },
  link: { color: colors.accentBlue, fontSize: 12, marginTop: 10 },
  errorText: { color: colors.accentRed, fontSize: 12, marginTop: 8, lineHeight: 17 },
  inputError: { borderColor: colors.accentRed },
  saveBtn: {
    marginTop: 26,
    backgroundColor: colors.accentTeal,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveBtnText: { color: colors.onAccent, fontWeight: "700", fontSize: 14 },
  clearBtn: { marginTop: 14, alignItems: "center" },
  clearBtnText: { color: colors.accentRed, fontSize: 13 },
});
