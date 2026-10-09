import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BrandIcon, BrandIconName, BrandLogo } from "../branding/Brand";
import { ThemePreference, useColors, useThemePreference } from "../context/ThemeContext";
import { useProfile } from "../context/ProfileContext";
import { useStyles } from "../theme/useStyles";
import type { Colors } from "../theme/colors";

const choices: { id: ThemePreference; label: string; detail: string; icon: BrandIconName }[] = [
  { id: "system", label: "Use device setting", detail: "Match your phone’s appearance.", icon: "settings" },
  { id: "dark", label: "Dark", detail: "STRIX’s dark navy default.", icon: "timer" },
  { id: "light", label: "Light", detail: "A soft blue-white reading mode.", icon: "ai" },
];

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { preference, setPreference } = useThemePreference();
  const { displayName, setDisplayName } = useProfile();
  const colors = useColors();
  const styles = useStyles(makeStyles);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const startEditName = () => {
    setNameDraft(displayName);
    setEditingName(true);
  };
  const saveName = () => {
    setDisplayName(nameDraft);
    setEditingName(false);
  };

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
    <Pressable style={styles.back} onPress={() => navigation.goBack()}><BrandIcon name="more" size={22} /></Pressable>
    <BrandLogo />

    {/* ---------- Profile / display name ---------- */}
    <Text style={styles.title}>Profile</Text>
    <Text style={styles.subtitle}>Your name is only used for greetings inside the app — it never leaves this device.</Text>
    <View style={styles.card}>
      <View style={styles.profileRow}>
        <BrandIcon name="profile" boxed />
        <View style={{ flex: 1 }}>
          {editingName ? (
            <>
              <Text style={styles.rowTitle}>Display name</Text>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="e.g. Alex"
                placeholderTextColor={colors.textFaint}
                style={styles.nameInput}
                maxLength={40}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
            </>
          ) : (
            <>
              <Text style={styles.rowTitle}>{displayName || "Add your name"}</Text>
              <Text style={styles.rowDetail}>
                {displayName ? "Shown in your home-screen greeting." : "Set a name for your home-screen greeting."}
              </Text>
            </>
          )}
        </View>
        {editingName ? (
          <Pressable style={styles.editBtn} onPress={saveName}><Text style={styles.editBtnText}>Save</Text></Pressable>
        ) : (
          <Pressable style={styles.editBtn} onPress={startEditName}><BrandIcon name="edit" size={14} /><Text style={styles.editBtnText}>Edit</Text></Pressable>
        )}
      </View>
    </View>

    {/* ---------- Appearance ---------- */}
    <Text style={styles.title}>Appearance</Text><Text style={styles.subtitle}>Choose how STRIX looks. Your preference is saved on this device.</Text>
    <View style={styles.card}>{choices.map((choice) => <Pressable key={choice.id} onPress={() => setPreference(choice.id)} style={[styles.row, preference === choice.id && styles.rowActive]}><BrandIcon name={choice.icon} active={preference === choice.id} boxed /><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{choice.label}</Text><Text style={styles.rowDetail}>{choice.detail}</Text></View><View style={[styles.radio, preference === choice.id && styles.radioActive]}>{preference === choice.id && <View style={styles.radioInner} />}</View></Pressable>)}</View>
    <View style={styles.note}><Text style={styles.noteTitle}>STRIX color language</Text><Text style={styles.noteText}>Teal stays primary, with blue and purple supporting accents in both themes.</Text></View>

    {/* ---------- Learn ---------- */}
    <Text style={styles.title}>Learn</Text>
    <Text style={styles.subtitle}>What STRIX is, how to get the most out of it, and quick answers.</Text>
    <View style={styles.card}>
      <NavRow icon="info" title="About STRIX" detail="What this app is and why it exists." onPress={() => navigation.navigate("About")} />
      <NavRow icon="book" title="How to Use" detail="The tree, Quick Note, and the three AI features." onPress={() => navigation.navigate("HowToUse")} />
      <NavRow icon="help" title="FAQ" detail="Privacy, API keys, billing, and offline use." onPress={() => navigation.navigate("Faq")} />
    </View>

    {/* ---------- Legal & privacy ---------- */}
    <Text style={styles.title}>Legal & Privacy</Text>
    <Text style={styles.subtitle}>Where your data goes — and the terms that come with AI features.</Text>
    <View style={styles.card}>
      <NavRow icon="shield" title="Privacy Policy" detail="Notes stay on-device; AI goes straight to Google." onPress={() => navigation.navigate("PrivacyPolicy")} />
      <NavRow icon="document" title="Terms of Use" detail="Personal use, AI disclaimers, your API billing." onPress={() => navigation.navigate("TermsOfUse")} />
    </View>

    <View style={styles.note}><Text style={styles.noteTitle}>Built to stay yours</Text><Text style={styles.noteText}>STRIX has no servers and collects nothing. Everything is stored on this device.</Text></View>
  </ScrollView>;
}

function NavRow({ icon, title, detail, onPress }: { icon: BrandIconName; title: string; detail: string; onPress: () => void }) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <BrandIcon name={icon} boxed />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <BrandIcon name="chevron" size={16} />
    </Pressable>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 22, paddingTop: 44, gap: 16, paddingBottom: 60 },
  back: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontSize: 25, fontWeight: "800", marginTop: 12 },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  card: { borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowActive: { backgroundColor: colors.highlight },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  rowDetail: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  nameInput: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.accentTeal,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 6,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accentTeal,
    backgroundColor: colors.highlight,
  },
  editBtnText: { color: colors.accentText, fontSize: 12, fontWeight: "700" },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 2, borderColor: colors.textFaint, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: colors.accentText },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentText },
  note: { borderRadius: 15, padding: 14, backgroundColor: colors.note, borderWidth: 1, borderColor: colors.borderStrong },
  noteTitle: { color: colors.accentText, fontWeight: "700", fontSize: 13 },
  noteText: { color: colors.noteText, fontSize: 12, lineHeight: 17, marginTop: 5 },
});
