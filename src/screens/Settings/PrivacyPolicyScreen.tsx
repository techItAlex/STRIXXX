import React from "react";
import {
  Bullets,
  Emphasis,
  InfoCard,
  Paragraph,
  SettingsSubScreen,
} from "./SettingsSubScreen";

export default function PrivacyPolicyScreen() {
  return (
    <SettingsSubScreen
      title="Privacy Policy"
      subtitle="Last updated: September 2026. Plain-language version — the short of it is that STRIX collects nothing."
    >
      <InfoCard title="The short version">
        <Bullets
          items={[
            "STRIX has no server, no accounts, and no analytics or trackers.",
            "Your notes, study sessions, chat history, and settings stay on this device.",
            "Local AI processes prompts and selected note context on this device. If you choose Cloud (Gemini), the content needed for that request is sent to Google using your own key.",
            "STRIX itself never sees, stores, or transmits your data anywhere.",
          ]}
        />
      </InfoCard>

      <InfoCard title="1 · What stays on your device">
        <Paragraph>
          Your knowledge tree (note titles and note content), study sessions,
          recent AI conversations, display name, theme preference, and
          onboarding state are stored locally through your device's standard
          app storage. STRIX has no backend or cloud backup. In optional Gemini
          mode, only the text and relevant context for a request are sent to
          Google as described below. Calendar deadline parsing uses the local
          GGUF model on-device.
        </Paragraph>
        <Paragraph>
          Your Gemini API key is stored separately in your device's secure
          storage (iOS Keychain / Android Keystore), encrypted at rest by the
          operating system. It is not written to ordinary app storage and is
          not displayed in the interface after you enter it.
        </Paragraph>
      </InfoCard>

      <InfoCard title="2 · Optional cloud AI: what is sent to Google">
        <Paragraph>
          Only when you select Cloud (Gemini) and use an AI feature routed through that mode does your
          device contact Google's Gemini API at
          generativelanguage.googleapis.com. Local mode runs the selected GGUF
          model on-device and does not send prompts to Gemini. A cloud request
          may contain:
        </Paragraph>
        <Bullets
          items={[
            "The text you typed (your question, term, or explanation).",
            "For 'Discuss my notes' only: the few saved notes that match your question, plus recent messages in that conversation.",
            "For organization and planning: your existing tree's titles/structure and your session counts — never whole note bodies.",
            "Your Gemini API key, as the request's authentication header.",
          ]}
        />
        <Paragraph>
          This happens device-to-Google. The content passes through no
          STRIX-owned service, and no copy is retained by the app beyond
          your own local chat history.
        </Paragraph>
      </InfoCard>

      <InfoCard title="3 · What STRIX does not do">
        <Bullets
          items={[
            "No analytics, crash reporters, or tracking SDKs of any kind.",
            "No advertising networks and no data brokers.",
            "No accounts, so no names, emails, or contact details are collected.",
            "No server-side logs, because there are no servers.",
            "Nothing is sold, shared, or rented — there is nothing to share.",
          ]}
        />
      </InfoCard>

      <InfoCard title="4 · Third parties">
        <Paragraph>
          The only third party that may receive AI content is Google, through
          the Gemini API calls you trigger. Those requests are governed by
          Google's own terms and privacy policy; STRIX has no visibility
          into or control over them beyond what Google states. Your device
          platform (Apple/Google) also processes standard local-storage
          operations under its own policies.
        </Paragraph>
        <Emphasis>
          Note: when you choose Cloud (Gemini), prompts sent to Gemini are processed by Google under the terms
          of your Gemini API agreement, not under STRIX's control.
        </Emphasis>
      </InfoCard>

      <InfoCard title="5 · Deleting your data">
        <Bullets
          items={[
            "Delete notes or whole branches with a long-press in the Tree.",
            "Remove your API key anytime from AI → Manage your API key.",
            "Clearing the app's data or uninstalling the app removes everything, including local settings and the stored key.",
          ]}
        />
      </InfoCard>

      <InfoCard title="6 · Changes to this policy">
        <Paragraph>
          If how STRIX handles data ever changes, this screen will be
          updated to match — check here for the current version. Because
          STRIX ships no telemetry, there is no hidden behaviour to discover
          elsewhere.
        </Paragraph>
      </InfoCard>
    </SettingsSubScreen>
  );
}
