// Strix's core data model: a single self-referencing "node" tree.
// A node can be a Field, Subject, Topic, Lesson, or Word/Note — and any
// node can have children of any type, so a branch can skip levels
// (e.g. Field -> Word directly) exactly as designed in the PRD.

export type NodeLevel = "field" | "subject" | "topic" | "lesson" | "word";

export type ContentKind = "text" | "image" | "audio" | "link";

export interface NodeContent {
  kind: ContentKind;
  // For "text": the note body itself.
  // For "image"/"audio": a local file URI (wiring up the real picker is
  // left as a follow-up — see README).
  // For "link": a URL string.
  value: string;
}

export interface StrixNode {
  id: string;
  parentId: string | null;
  level: NodeLevel;
  title: string;
  icon?: string;
  description?: string;
  content?: NodeContent; // typically present on "word"-level leaf notes
  // Sibling display order. Omitted nodes retain the original alphabetical order
  // until the user arranges that branch.
  sortOrder?: number;
  createdAt: number;
  updatedAt: number;
}

// The five levels in their typical (non-mandatory) order, used for the
// Quick Note "where do you want to place it" step and for suggesting
// the next sensible level under a given parent.
export const LEVEL_ORDER: NodeLevel[] = [
  "field",
  "subject",
  "topic",
  "lesson",
  "word",
];

export function levelLabel(level: NodeLevel): string {
  switch (level) {
    case "field":
      return "Field";
    case "subject":
      return "Subject";
    case "topic":
      return "Topic";
    case "lesson":
      return "Lesson";
    case "word":
      return "Word / Term";
  }
}
