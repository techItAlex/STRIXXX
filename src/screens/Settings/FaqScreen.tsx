import React from "react";
import { FaqItem, SettingsSubScreen } from "./SettingsSubScreen";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is my data private?",
    a: "Yes. STRIX has no server, no accounts, and no analytics — your notes, study sessions, and settings are stored only on this device. The one exception is AI features: when you use them, the relevant text goes directly from your phone to Google's Gemini API using your own key. Nothing passes through STRIX, because STRIX has no backend at all.",
  },
  {
    q: "Do I need to pay for AI?",
    a: "STRIX itself is free. AI features use your own Gemini API key, and Google AI Studio offers a free tier that's plenty for personal use. If you exceed it, Google may charge the billing attached to your Google Cloud project — that account, its usage, and its limits are entirely yours to manage.",
  },
  {
    q: "What happens if I lose my API key?",
    a: "Nothing breaks — AI features just stop until a key is present. Your key is stored in this device's secure keychain/keystore, not in your notes. If you get a new phone or reinstall, generate a fresh free key at Google AI Studio and paste it into AI → Bring Your Own API Key. The old key can be revoked in AI Studio whenever you like.",
  },
  {
    q: "Do I need an account to use STRIX?",
    a: "No. There's no sign-up, no login, and no profile on any server. Your display name is a local label used for greetings and nothing else.",
  },
  {
    q: "Does it work offline?",
    a: "Everything except AI does. Notes, the tree, search, Quick Note, and the Focus Timer all work with no connection. AI features (and pasting your key the first time) need internet because they talk to Google's API directly.",
  },
  {
    q: "Why doesn't the AI see all of my notes?",
    a: "For 'Discuss my notes', STRIX picks only the few notes that keyword-match your question and sends just those. It's better for answers (less noise) and better for privacy — most of your tree never leaves the device.",
  },
  {
    q: "Can I delete everything?",
    a: "Yes. Delete individual notes or branches from the Tree (long-press), remove saved AI chats from the app data, remove your API key from AI → Manage your API key, and uninstalling the app removes everything else.",
  },
];

export default function FaqScreen() {
  return (
    <SettingsSubScreen
      title="FAQ"
      subtitle="The questions people ask first."
    >
      {FAQ.map((item) => (
        <FaqItem key={item.q} question={item.q} answer={item.a} />
      ))}
    </SettingsSubScreen>
  );
}
