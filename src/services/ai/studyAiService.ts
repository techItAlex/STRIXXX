import { generateText } from "./provider";
import { getAiRuntime, isAiAvailable } from "./aiRuntime";
import { sanitizeText, MAX_TITLE_CHARS } from "./sanitize";
import { StrixNode } from "../../types";
import { StudySession } from "../../context/StudyContext";

type Plan = { minutes: number; reason: string; source: "ai" | "starter" };

function parseJson(text: string) {
  const match = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(match ? match[1] : text);
}

function historySummary(history: StudySession[]) {
  if (!history.length) return "No prior sessions for this topic.";
  const total = history.reduce((sum, item) => sum + item.focusedSeconds, 0);
  const completion = Math.round(history.filter((item) => item.completed).length / history.length * 100);
  return `${history.length} sessions, ${Math.round(total / 60)} focused minutes total, ${completion}% reached the planned duration.`;
}

export async function recommendStudyPlan({ apiKey, topic, history }: { apiKey: string | null; topic: StrixNode; history: StudySession[] }): Promise<Plan> {
  const starter: Plan = {
    minutes: history.length ? 35 : 25,
    reason: history.length
      ? "This is a moderate next session based on your earlier time with this topic. You can adjust it anytime."
      : "A focused 25-minute starting session is a manageable way to begin with a new topic.",
    source: "starter",
  };
  if (!isAiAvailable(apiKey)) return starter;
  try {
    const title = sanitizeText(topic.title, MAX_TITLE_CHARS);
    const description = sanitizeText(topic.description, MAX_TITLE_CHARS) || "No description";
    const raw = await generateText({
      apiKey,
      jsonResponse: true,
      systemInstruction: "You are a study-planning assistant. Recommend a realistic focused study duration based on the topic and recorded behavior. Do not claim time proves learning. Respond only as JSON: {\"minutes\": number, \"reason\": string}. Keep minutes between 10 and 90 and reason under 35 words.",
      prompt: `Topic: ${title}\nDescription: ${description}\nHistory: ${historySummary(history)}`,
    });
    const parsed = parseJson(raw);
    const minutes = Math.max(10, Math.min(90, Math.round(Number(parsed.minutes)) || starter.minutes));
    return { minutes, reason: String(parsed.reason || starter.reason), source: "ai" };
  } catch (error) {
    if (getAiRuntime().mode === "local") throw error;
    return starter;
  }
}

export async function analyzeStudySession({ apiKey, topic, session, priorSessions }: { apiKey: string | null; topic: StrixNode; session: StudySession; priorSessions: StudySession[] }) {
  const focused = Math.round(session.focusedSeconds / 60);
  const planned = Math.round(session.plannedSeconds / 60);
  const title = sanitizeText(topic.title, MAX_TITLE_CHARS);
  const fallback = `You recorded ${focused} focused minutes against a ${planned}-minute plan, with ${session.pauseCount} pause${session.pauseCount === 1 ? "" : "s"}. This describes study behavior, not proof of understanding. A reasonable next step is to review your notes for “${title}” and choose a duration that felt sustainable.`;
  if (!isAiAvailable(apiKey)) return fallback;
  try {
    return await generateText({
      apiKey,
      systemInstruction: "You are STRIX's study-session analyst. Describe observed study behavior only; time does not prove learning or understanding. Mention planned vs actual time, pauses, topic history, a suggested next duration, and one practical next action. Be encouraging, concise, and factual.",
      prompt: `Topic: ${title}\nThis session: planned ${planned} min; focused ${focused} min; paused ${Math.round(session.pausedSeconds / 60)} min; pauses ${session.pauseCount}; completed ${session.completed}.\nPrevious sessions: ${historySummary(priorSessions)}`,
    });
  } catch (error) {
    if (getAiRuntime().mode === "local") throw error;
    return fallback;
  }
}
