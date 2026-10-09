import React from "react";
import { Bullets, InfoCard, Paragraph, SettingsSubScreen } from "./SettingsSubScreen";

export default function AboutScreen() {
  return (
    <SettingsSubScreen
      title="About STRIX"
      subtitle="What this app is, and what it's for."
    >
      <InfoCard title="What STRIX is">
        <Paragraph>
          STRIX is a personal learning tracker. It lets you build a flexible
          knowledge tree out of everything you learn — broad Fields at the top,
          then Subjects, Topics, Lessons, and individual Words or notes — with
          no fixed structure: any node can parent any other, so a branch can
          skip levels whenever that's how you actually think about the
          material.
        </Paragraph>
        <Paragraph>
          Alongside the tree there's a Quick Note flow for capturing a term in
          seconds, a Focus Timer that records real study sessions, and an AI
          Companion that helps you discuss, check, and organize what you've
          saved.
        </Paragraph>
      </InfoCard>

      <InfoCard title="What it's for">
        <Bullets
          items={[
            "Keeping what you learn in one place you actually control.",
            "Turning scattered notes into structure you can browse later.",
            "Checking your understanding instead of just re-reading.",
            "Studying in short, focused sessions tied to real topics.",
          ]}
        />
      </InfoCard>

      <InfoCard title="How AI fits in">
        <Paragraph>
          AI in STRIX is optional and uses your own Gemini API key. When you
          use an AI feature, the relevant text is sent directly from your phone
          to Google's Gemini API and the reply comes straight back — STRIX
          has no server in the middle. Everything else stays on your device.
        </Paragraph>
        <Paragraph>
          The app works fully offline for notes, browsing, and the timer; only
          the AI features need an internet connection.
        </Paragraph>
      </InfoCard>

      <InfoCard title="The short version">
        <Paragraph>
          Build what you know — privately, on your own device, at your own
          pace.
        </Paragraph>
      </InfoCard>
    </SettingsSubScreen>
  );
}
