import React from "react";
import { FaqItem, SettingsSubScreen } from "./SettingsSubScreen";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is my data private?",
    a: "STRIX has no server, accounts, or analytics. Notes, study sessions, settings, and local AI processing stay on this device. If you choose Cloud (Gemini), the text needed for that request is sent directly to Google's Gemini API using your key.",
  },
  {
    q: "Is local AI the main AI?",
    a: "Yes. On-device mode is the default and primary option. Load a compatible GGUF model in the Local model smoke test to use AI on your phone without an API key or internet. Gemini is an optional cloud mode.",
  },
  {
    q: "Do I need to pay for AI?",
    a: "You can use local AI without a Gemini key; you need to download a model and have enough phone storage and memory. Optional Gemini cloud mode uses your own key and is subject to Google's quotas, pricing, and billing terms.",
  },
  {
    q: "What happens if I lose my API key?",
    a: "Local AI continues to work without a key if a model is loaded. Only optional Gemini cloud mode needs the key. Your key is stored in this device's secure keychain/keystore, not in your notes. Create a replacement in Google AI Studio if you want to use Gemini again.",
  },
  {
    q: "Do I need an account to use STRIX?",
    a: "No. There's no sign-up, login, or profile on a STRIX server. Your display name is a local label used for greetings.",
  },
  {
    q: "Does it work offline?",
    a: "Yes. Notes, the tree, search, Quick Note, calendar, and Focus Timer work offline. Local AI also works offline after a compatible GGUF model is loaded. Gemini cloud mode and the first API-key setup require internet.",
  },
  {
    q: "Why doesn't the AI see all of my notes?",
    a: "For Discuss my notes, STRIX selects a few keyword-matching notes on-device. In local mode, they stay on your phone. If you select Gemini cloud mode, those selected notes and recent conversation messages are sent to Google with the request.",
  },
  {
    q: "Can I delete everything?",
    a: "Yes. Delete notes or branches from the Tree, clear saved AI chats and app data, remove your Gemini key from AI settings, or uninstall the app to remove local data.",
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
