import { StrixNode } from "../../types";

export type ChatRole = "user" | "assistant";

export interface RelatedNoteRef {
  nodeId: string;
  title: string;
  pathLabel: string; // e.g. "Topic: Data Structures • Lesson: Trees"
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
  usedNotes?: boolean; // true if this assistant reply drew on the tree
  relatedNote?: RelatedNoteRef; // shown as a "Related note" card
}

export type JudgeVerdict = "good" | "needs_work" | "incorrect";

export interface JudgeResult {
  verdict: JudgeVerdict;
  feedback: string;
  betterExplanation: string;
  keyPoints: string[];
}

export type SuggestionConfidence = "high" | "medium" | "low";

export interface PlacementSuggestion {
  subjectNodeId: string;
  subjectTitle: string;
  fieldTitle: string;
  confidence: SuggestionConfidence;
}

export interface PlacementResult {
  suggestions: PlacementSuggestion[];
  suggestNewSubject: boolean;
  proposedSubjectName?: string;
  proposedFieldTitle?: string;
}

// Thrown by the provider layer; the UI shows err.message directly, so keep
// these short and actionable (e.g. "Add your Gemini API key first.").
export class AiServiceError extends Error {}

export interface RetrievedContext {
  node: StrixNode;
  pathLabel: string;
  score: number;
}
