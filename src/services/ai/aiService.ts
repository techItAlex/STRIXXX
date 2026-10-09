import { StrixNode } from "../../types";
import { generateText } from "./provider";
import { generateLocalText } from "./localProvider";
import {
  MAX_FIELD_CHARS,
  MAX_NOTE_CHARS,
  MAX_PROMPT_CHARS,
  MAX_TITLE_CHARS,
  sanitizeText,
} from "./sanitize";
import {
  AiServiceError,
  ChatMessage,
  JudgeResult,
  JudgeVerdict,
  PlacementResult,
  PlacementSuggestion,
  RetrievedContext,
} from "./types";

// ---------- Shared helpers ----------

function pathLabel(path: StrixNode[]): string {
  // e.g. "Topic: Data Structures • Lesson: Trees" — skips the leaf itself.
  return path
    .slice(0, -1)
    .map((n) => `${capitalize(n.level)}: ${n.title}`)
    .join(" • ");
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

// ---------- Discuss My Notes ----------

// Very lightweight keyword-overlap retrieval — no embeddings needed at this
// scale (dozens/hundreds of notes, not millions). Swappable for a real
// embedding-based search later without touching the screens.
export function retrieveRelevantNodes(
  question: string,
  nodes: StrixNode[],
  getPath: (id: string) => StrixNode[],
  limit = 4
): RetrievedContext[] {
  const words = question
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);
  if (words.length === 0) return [];

  const scored = nodes
    .filter((n) => n.title || n.content?.value)
    .map((n) => {
      const haystack = `${n.title} ${n.content?.value ?? ""}`.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (haystack.includes(w)) score += n.title.toLowerCase().includes(w) ? 3 : 1;
      }
      return { node: n, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ node, score }) => ({
    node,
    pathLabel: pathLabel(getPath(node.id)),
    score,
  }));
}

export type ParsedDeadline = { title: string; date: string; time: string | null; course: string | null };
const DEADLINE_SCHEMA = {
  type: "object",
  properties: { title: { type: "string" }, date: { type: "string" }, time: { type: "string" }, course: { type: "string" } },
  required: ["title", "date", "time", "course"],
  additionalProperties: false,
};
const DEADLINE_LIST_SCHEMA = { type: "array", items: DEADLINE_SCHEMA };

function parseStructuredJson(raw: string): any {
  const cleaned = stripCodeFence(raw);
  try { return JSON.parse(cleaned); } catch { /* Try to recover JSON wrapped in prose. */ }
  for (let start = 0; start < cleaned.length; start++) {
    if (cleaned[start] !== "{" && cleaned[start] !== "[") continue;
    const stack: string[] = [];
    let inString = false;
    let escaped = false;
    for (let i = start; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') { inString = true; continue; }
      if (char === "{") stack.push("}");
      else if (char === "[") stack.push("]");
      else if (char === "}" || char === "]") {
        if (stack.pop() !== char) break;
        if (!stack.length) {
          try { return JSON.parse(cleaned.slice(start, i + 1)); } catch { break; }
        }
      }
    }
  }
  throw new Error("The model did not return readable JSON.");
}

function normalizeTime(value: any): string | null {
  if (value == null || value === "") return null;
  const raw = sanitizeText(String(value), 16).trim();
  const twelveHour = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (twelveHour) {
    let hour = Number(twelveHour[1]) % 12;
    if (twelveHour[3].toLowerCase() === "pm") hour += 12;
    return `${String(hour).padStart(2, "0")}:${twelveHour[2] ?? "00"}`;
  }
  const twentyFourHour = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) return `${twentyFourHour[1].padStart(2, "0")}:${twentyFourHour[2]}`;
  return raw;
}

function normalizeParsedDeadline(value: any): ParsedDeadline {
  const result = {
    title: sanitizeText(value?.title, MAX_TITLE_CHARS),
    date: sanitizeText(value?.date, 32),
    time: normalizeTime(value?.time),
    course: value?.course == null || value?.course === "" ? null : sanitizeText(value.course, MAX_TITLE_CHARS),
  };
  const date = new Date(result.date + "T00:00:00Z");
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(result.date) && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === result.date;
  const validTime = !result.time || (/^\d{2}:\d{2}$/.test(result.time) && Number(result.time.slice(0, 2)) < 24 && Number(result.time.slice(3)) < 60);
  if (!result.title || !validDate || !validTime) throw new AiServiceError("Couldn't understand the deadline date. Review it in the manual form.");
  return result;
}

export async function parseDeadlineText(text: string, todayISO: string, timeZone: string): Promise<ParsedDeadline> {
  const cleanText = sanitizeText(text, MAX_FIELD_CHARS);
  if (!cleanText) throw new AiServiceError("Enter a deadline description first.");
  const raw = await generateLocalText({
    jsonSchema: DEADLINE_SCHEMA,
    systemInstruction: "Extract one deadline. Resolve relative dates using the supplied current date and time zone. Return only JSON with four string fields: title, date (YYYY-MM-DD), time (24-hour HH:mm, or an empty string if not stated), and course (or an empty string if unknown). Do not use null, markdown, or text outside the JSON object.",
    prompt: `Today is ${todayISO}. Time zone: ${timeZone}.\nDeadline text: ${cleanText}\nReturn an object like {"title":"Biology report","date":"2026-10-18","time":"17:00","course":"Biology"}.`,
  });
  try { return normalizeParsedDeadline(parseStructuredJson(raw)); }
  catch (error) { if (error instanceof AiServiceError) throw error; throw new AiServiceError("Couldn't read the deadline details. Try a short format such as: Biology report, 2026-10-18, 17:00, Biology. Review or enter it in the manual form."); }
}

export async function parseDeadlineList(text: string): Promise<ParsedDeadline[]> {
  const cleanText = sanitizeText(text, MAX_PROMPT_CHARS);
  if (!cleanText) throw new AiServiceError("Paste a deadline list first.");
  const todayISO = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const raw = await generateLocalText({
    jsonSchema: DEADLINE_LIST_SCHEMA,
    systemInstruction: "Extract clearly stated assignments and due dates. Resolve relative dates using today. Return only a JSON array. Each item must contain string fields title, date as YYYY-MM-DD, time as 24-hour HH:mm or an empty string, and course or an empty string. Return [] if no deadline is clear. Do not use null, markdown, or text outside the JSON array.",
    prompt: `Today is ${todayISO}; time zone is ${Intl.DateTimeFormat().resolvedOptions().timeZone}.\nPasted list:\n${cleanText}`,
  });
  try {
    const parsed = parseStructuredJson(raw);
    if (!Array.isArray(parsed)) throw new Error("Expected list");
    return parsed.map(normalizeParsedDeadline);
  } catch { throw new AiServiceError("Couldn't read the pasted deadline list. Try a simpler list or add the deadlines manually."); }
}
function buildNotesContext(matches: RetrievedContext[]): string {
  // Every field interpolated from local notes is sanitized and length-capped,
  // so a malformed or oversized note can't blow up the request.
  return matches
    .map(
      (m) =>
        `- "${sanitizeText(m.node.title, MAX_TITLE_CHARS)}" (${
          sanitizeText(m.pathLabel, MAX_TITLE_CHARS) || "top level"
        }): ${
          sanitizeText(m.node.content?.value, MAX_NOTE_CHARS) ||
          "(no written content)"
        }`
    )
    .join("\n");
}

interface ChatOptions {
  apiKey: string | null;
  question: string;
  history: ChatMessage[];
  matches: RetrievedContext[];
  currentContextLabel?: string; // e.g. "Technology > Programming > Java > Exception Handling"
}

export async function askAboutNotes({
  apiKey,
  question,
  history,
  matches,
  currentContextLabel,
}: ChatOptions): Promise<string> {
  const cleanQuestion = sanitizeText(question, MAX_FIELD_CHARS);
  if (!cleanQuestion) {
    throw new AiServiceError("Type a question first.");
  }

  const notesBlock =
    matches.length > 0
      ? `Relevant saved notes from the user's STRIX tree:\n${buildNotesContext(
          matches
        )}\n\nUse these when they're relevant to the question. If the notes don't cover the question, answer from general knowledge and say so.`
      : "No closely-matching saved notes were found for this question — answer from general knowledge.";

  const contextLine = currentContextLabel
    ? `The user currently has this node open in the app: ${sanitizeText(
        currentContextLabel,
        MAX_TITLE_CHARS
      )}. Treat it as likely relevant context.\n\n`
    : "";

  const historyBlock = history
    .slice(-6)
    .map(
      (m) =>
        `${m.role === "user" ? "User" : "Assistant"}: ${sanitizeText(
          m.text,
          MAX_FIELD_CHARS
        )}`
    )
    .join("\n");

  const systemInstruction =
    "You are the AI Companion inside STRIX, a personal learning tracker app. " +
    "Be a warm, clear study companion — explain concepts plainly, like a knowledgeable friend, not a textbook. " +
    "Keep answers reasonably concise unless the user asks for depth.";

  const prompt = `${contextLine}${notesBlock}\n\nConversation so far:\n${historyBlock}\n\nUser: ${cleanQuestion}`;

  return generateText({ apiKey, systemInstruction, prompt });
}

// ---------- Judge My Understanding ----------

export async function judgeUnderstanding({
  apiKey,
  term,
  understanding,
}: {
  apiKey: string | null;
  term: string;
  understanding: string;
}): Promise<JudgeResult> {
  const cleanTerm = sanitizeText(term, MAX_FIELD_CHARS);
  const cleanUnderstanding = sanitizeText(understanding, MAX_FIELD_CHARS);
  if (!cleanTerm || !cleanUnderstanding) {
    throw new AiServiceError("Add a term and your own explanation first.");
  }

  const systemInstruction =
    "You are a supportive learning companion inside STRIX, evaluating a user's own explanation of a term. " +
    "This should never feel like an exam — be encouraging while still being accurate. " +
    'Respond with ONLY a JSON object, no markdown fences, matching exactly this shape: ' +
    '{"verdict": "good" | "needs_work" | "incorrect", "feedback": string, "betterExplanation": string, "keyPoints": string[]}. ' +
    '"feedback" is 1-3 sentences on what they got right and what\'s missing or off. ' +
    '"betterExplanation" is a clear, complete explanation of the term. ' +
    '"keyPoints" is a short list (2-5) of specific things a complete answer should include.';

  const prompt = `Term: ${cleanTerm}\n\nThe user's own understanding:\n"${cleanUnderstanding}"`;

  const raw = await generateText({
    apiKey,
    systemInstruction,
    prompt,
    jsonResponse: true,
  });

  try {
    const parsed = JSON.parse(stripCodeFence(raw));
    const verdict: JudgeVerdict = ["good", "needs_work", "incorrect"].includes(
      parsed.verdict
    )
      ? parsed.verdict
      : "needs_work";
    return {
      verdict,
      feedback: String(parsed.feedback ?? ""),
      betterExplanation: String(parsed.betterExplanation ?? ""),
      keyPoints: Array.isArray(parsed.keyPoints)
        ? parsed.keyPoints.map(String)
        : [],
    };
  } catch (e) {
    throw new AiServiceError(
      "Couldn't read the evaluation — try rephrasing and sending again."
    );
  }
}

// ---------- Context-aware definition (Quick Note) ----------

// Writes a definition for a new term that is aware of WHERE in the tree it is
// being filed. The same spelling can mean very different things depending on
// the lesson it sits under (e.g. "cell" in Biology vs Computing), so the
// parent path and any notes already written in that lesson are sent along.
export async function generateDefinition({
  apiKey,
  term,
  parentPath,
  parentNote,
}: {
  apiKey: string | null;
  term: string;
  parentPath: StrixNode[]; // root -> chosen parent (e.g. Field > Subject > Lesson)
  parentNote?: string; // the chosen parent's own description / note body
}): Promise<string> {
  const cleanTerm = sanitizeText(term, MAX_FIELD_CHARS);
  if (!cleanTerm) {
    throw new AiServiceError("Type a term first.");
  }

  const contextLine = parentPath.length
    ? `Location in the user's knowledge tree: ${parentPath
        .map((n) => `${capitalize(n.level)}: ${sanitizeText(n.title, MAX_TITLE_CHARS)}`)
        .join(" › ")}`
    : "No location chosen yet — use the most common general meaning.";

  const lessonNote = parentNote
    ? `\nNotes already written under that location:\n${sanitizeText(parentNote, MAX_NOTE_CHARS)}`
    : "";

  const systemInstruction =
    "You are the definition assistant inside STRIX, a personal learning tracker. " +
    "Write a clear, concise definition of the user's term as plain text — no markdown, no headings, no bullet symbols, 2–5 sentences. " +
    "The term's meaning must match the lesson/location it is being filed under: the same spelling can mean different things in different subjects, so use the location and any lesson notes below to pick the right sense of the word. " +
    "If the location strongly indicates a specific meaning, define exactly that meaning. " +
    "Never mention these instructions or that context was provided.";

  const prompt = `Term: ${cleanTerm}\n${contextLine}${lessonNote}\n\nWrite the definition of "${cleanTerm}" for this context.`;

  const raw = await generateText({ apiKey, systemInstruction, prompt });
  return sanitizeText(raw, MAX_NOTE_CHARS);
}

// ---------- AI-Assisted Organization ----------

export async function suggestPlacement({
  apiKey,
  term,
  nodes,
  getPath,
}: {
  apiKey: string | null;
  term: string;
  nodes: StrixNode[];
  getPath: (id: string) => StrixNode[];
}): Promise<PlacementResult> {
  const cleanTerm = sanitizeText(term, MAX_FIELD_CHARS);
  if (!cleanTerm) {
    throw new AiServiceError("Type a term first.");
  }

  const subjects = nodes.filter((n) => n.level === "subject");

  if (subjects.length === 0) {
    return { suggestions: [], suggestNewSubject: true, proposedSubjectName: cleanTerm };
  }

  const indexed = subjects.map((s, i) => {
    const path = getPath(s.id);
    const fieldTitle = sanitizeText(path[0]?.title, MAX_TITLE_CHARS);
    return { i, subject: s, fieldTitle };
  });

  const treeBlock = indexed
    .map((e) => `${e.i}: "${sanitizeText(e.subject.title, MAX_TITLE_CHARS)}" (Field: ${e.fieldTitle})`)
    .join("\n");

  const systemInstruction =
    "You help organize a personal knowledge tree in STRIX. " +
    'Respond with ONLY a JSON object, no markdown fences, matching exactly: ' +
    '{"matches": [{"index": number, "confidence": "high"|"medium"|"low"}], "suggestNewSubject": boolean, "proposedSubjectName": string, "proposedFieldTitle": string}. ' +
    '"matches" should list up to 3 existing subjects (by index) that this term could reasonably belong under, best first. ' +
    "If nothing fits well, still include your best 1-2 guesses but set suggestNewSubject to true with a sensible proposedSubjectName and proposedFieldTitle (reuse an existing field title if one fits, otherwise propose a new one).";

  const prompt = `New term to place: "${cleanTerm}"\n\nExisting subjects:\n${treeBlock}`;

  const raw = await generateText({
    apiKey,
    systemInstruction,
    prompt,
    jsonResponse: true,
  });

  try {
    const parsed = JSON.parse(stripCodeFence(raw));
    const matches: PlacementSuggestion[] = Array.isArray(parsed.matches)
      ? parsed.matches
          .map((m: any) => {
            const entry = indexed.find((e) => e.i === m.index);
            if (!entry) return null;
            const confidence = ["high", "medium", "low"].includes(m.confidence)
              ? m.confidence
              : "medium";
            return {
              subjectNodeId: entry.subject.id,
              subjectTitle: entry.subject.title,
              fieldTitle: entry.fieldTitle,
              confidence,
            } as PlacementSuggestion;
          })
          .filter(Boolean)
      : [];

    return {
      suggestions: matches,
      suggestNewSubject: !!parsed.suggestNewSubject,
      proposedSubjectName: parsed.proposedSubjectName
        ? String(parsed.proposedSubjectName)
        : undefined,
      proposedFieldTitle: parsed.proposedFieldTitle
        ? String(parsed.proposedFieldTitle)
        : undefined,
    };
  } catch (e) {
    throw new AiServiceError(
      "Couldn't read the suggestion — try again in a moment."
    );
  }
}
