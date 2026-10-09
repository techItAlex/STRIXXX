import React from "react";
import { InfoCard, Paragraph, SettingsSubScreen, StepRow } from "./SettingsSubScreen";

export default function HowToUseScreen() {
  return (
    <SettingsSubScreen
      title="How to Use"
      subtitle="A two-minute tour: the tree, Quick Note, and the three AI features."
    >
      <InfoCard title="1 · Your knowledge tree">
        <Paragraph>
          Everything lives in one growing tree on the Tree tab. Levels are
          suggestions, not rules:
        </Paragraph>
        <StepRow badge="1" title="Field" body="A big area of life or study — Tech, Food, Health, School." />
        <StepRow badge="2" title="Subject" body="A branch inside a field — Programming, Nutrition." />
        <StepRow badge="3" title="Topic" body="A chunk of a subject — Deep Learning, Cooking Basics." />
        <StepRow badge="4" title="Lesson" body="One teachable unit inside a topic." />
        <StepRow badge="5" title="Word / Note" body="The leaf: a term, definition, or the note itself." />
        <Paragraph>
          Branches can skip levels (a Field can hold a Word directly). Tap a row
          to open it, long-press to delete, and use search to jump straight
          anywhere in the tree.
        </Paragraph>
      </InfoCard>

      <InfoCard title="2 · Quick Note">
        <Paragraph>
          The blue-green "Quick Note" button sits on the Home screen (and the
          Create tab does the same job as a guided wizard). The flow takes
          about ten seconds:
        </Paragraph>
        <StepRow badge="1" title="Type the term" body="Whatever you just learned — a word, idea, or concept." />
        <StepRow badge="2" title="Choose where it goes" body="Search the placement list by name or path to jump straight to the right field or lesson — or pick manually, or create a new Field." />
        <StepRow badge="3" title="Add content" body="Write the definition or notes — or tap Generate AI Definition and AI writes one that fits the lesson it's under (media capture is coming later), then save." />
      </InfoCard>

      <InfoCard title="3 · Your AI Companion">
        <Paragraph>
          Open the AI tab to find three features. Each one sends only what you
          type (plus, for Discuss, the few most relevant saved notes) directly
          to Google's Gemini API with your own key.
        </Paragraph>
        <StepRow badge="1" title="Discuss my notes" body="Ask a question in plain language. STRIX pulls the closest-matching notes in as context and links back to the note it used." />
        <StepRow badge="2" title="Judge my understanding" body="Enter a term and explain it in your own words. You get a verdict (good / needs work / incorrect), feedback, a fuller explanation, and the key points you missed." />
        <StepRow badge="3" title="AI Organization" body="Type a new term and get suggested Subjects to file it under — or let AI propose a brand new Subject and the Field it belongs in." />
        <Paragraph>
          Before the first use, tap "Bring Your Own API Key" on the AI tab and
          paste a free key from Google AI Studio. You can remove it any time.
        </Paragraph>
      </InfoCard>

      <InfoCard title="A few extra tips">
        <StepRow badge="•" title="Focus Timer" body="Pick a topic, start a session, and STRIX records real study time against that node — with an optional AI plan and post-session summary." />
        <StepRow badge="•" title="Settings" body="Change your display name, switch between light and dark, and read the Privacy Policy and Terms any time." />
      </InfoCard>
    </SettingsSubScreen>
  );
}
