   // Input hygiene and secret redaction for everything that travels between
// the app and Gemini.
//
// The screens already trim most inputs before calling the AI layer, but this
// is the single choke point that guarantees it: a malformed paste (null bytes,
// zero-width characters, empty-after-trim, runaway length) can never reach the
// API — and the API key can never come back out inside an error message that
// gets shown in the UI.

import { sanitizeText } from "../../utils/text";

export { sanitizeText };

/** Ceiling for the full composed prompt sent to Gemini. */
export const MAX_PROMPT_CHARS = 24000;
/** Ceiling for the system instruction. */
export const MAX_SYSTEM_CHARS = 4000;
/** Ceiling for a single user-authored field (question, term, definition…). */
export const MAX_FIELD_CHARS = 4000;
/** Ceiling for note bodies pulled in as retrieval context. */
export const MAX_NOTE_CHARS = 2000;
/** Ceiling for titles/labels interpolated into prompts. */
export const MAX_TITLE_CHARS = 200;

/** Full prompt body — bounded at the provider level too. */
export function sanitizePrompt(value: unknown): string {
  return sanitizeText(value, MAX_PROMPT_CHARS);
}

// Characters that are never part of any API key but regularly ride along
// with a paste: whitespace (newlines, wrapped email/preview lines), control
// bytes, and zero-width / bidi formatting characters that are invisible in
// the input field. The auth header value must be exactly the key, so these
// are stripped — and only these. Everything printable is kept, because key
// formats change (Google has already shipped more than one) and corrupting
// a valid key would be worse than any junk this could catch.
const NON_KEY_NOISE =
  /[^!-~]/g;

/**
 * Repairs the common paste mistakes without ever logging the value.
 * Format-agnostic: no prefix, no length and no character set is required,
 * so it can never reject a current or future key format.
 */
export function normalizeApiKey(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(NON_KEY_NOISE, "");
}

/**
 * Rejects only *obvious* junk — an empty value, a pasted URL, or anything
 * still carrying whitespace/control bytes (which would corrupt the
 * x-goog-api-key header or be rejected by Google anyway).
 *
 * It deliberately makes NO assumption about key length, prefix ("AIza...")
 * or allowed characters: Google AI Studio issues keys in more than one
 * format, and treating a different length as invalid is exactly the bug
 * this function exists to avoid. Anything ambiguous passes through, and the
 * real verdict comes from the Gemini API itself.
 */
export function looksLikeApiKey(raw: string): boolean {
  if (!raw) return false;
  // A URL, not a key (e.g. a paste of the AI Studio page address).
  if (/^(https?:\/\/|www\.)/i.test(raw)) return false;
  // Anything left that would break the header value.
  if (/[^!-~]/.test(raw)) return false;
  return true;
}

/**
 * Removes a secret from text that is about to be displayed or logged.
 * Google's API error messages shouldn't contain the key, but this makes it
 * impossible for one to reach the UI even if a provider changed behaviour.
 */
export function redactSecret(
  text: string | undefined | null,
  secret: string | null | undefined
): string {
  if (!text) return "";
  if (!secret || secret.length < 8) return text;
  return text.split(secret).join("[redacted]");
}
