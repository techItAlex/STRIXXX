// Generic text hygiene shared by UI code and the AI service layer.
//
// Kept separate from src/services/ai/sanitize.ts so non-AI features
// (profile name, greetings) don't have to import from the AI layer.

/** Ceiling for a single user-authored field (name, term, question…). */
export const MAX_FIELD_CHARS = 4000;
/** Ceiling for display names — also keeps the stored value tiny. */
export const MAX_NAME_CHARS = 40;

/**
 * Normalizes user input before it is stored or sent anywhere:
 * - coerces non-strings (undefined/null/objects from bad callers) to ""
 * - strips null bytes and zero-width/BOM characters that can mangle requests
 * - unifies line endings and trims surrounding whitespace
 * - hard-caps length so a runaway paste can't produce an unbounded payload
 *
 * Returns "" for anything that ends up empty, so callers can treat
 * "falsy after sanitize" as "there was no real input".
 */
export function sanitizeText(value: unknown, maxLength: number = MAX_FIELD_CHARS): string {
  if (typeof value !== "string") return "";
  const cleaned = value
    .replace(/\u0000/g, "")
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

/** Display name: single line, trimmed, bounded, never empty-markers. */
export function sanitizeDisplayName(value: unknown): string {
  return sanitizeText(value, MAX_NAME_CHARS).replace(/\s+/g, " ");
}
