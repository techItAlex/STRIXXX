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
          On-device AI is STRIX's default and primary mode. Once you load a
          compatible GGUF model, generation runs on your phone. Your prompts
          and selected note context stay on-device in this mode; no Gemini
          key or internet connection is required.
        </Paragraph>
        <Paragraph>
          Gemini is an optional cloud mode. If you select it and add your own
          API key, the content needed for the request goes directly from your
          phone to Google's Gemini API. Notes, browsing, the calendar, and the
          timer remain available offline.
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
