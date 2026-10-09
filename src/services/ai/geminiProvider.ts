import { AiServiceError } from "./types";
import { incrementCloudRequestCount } from "./aiRuntime";
import {
  MAX_SYSTEM_CHARS,
  normalizeApiKey,
  redactSecret,
  sanitizePrompt,
  sanitizeText,
} from "./sanitize";

// The only file in the app that knows about Gemini's HTTP shape. Swapping
// providers later means changing this file only — aiService.ts and every
// screen call the provider-agnostic functions in aiService.ts, not this.
//
// Security notes (kept next to the only code that handles the key):
// - The API key travels exclusively in the `x-goog-api-key` header of
//   requests to generativelanguage.googleapis.com — the authentication
//   method Google documents for REST (and the same one its Gen AI SDKs use
//   under the hood), valid for both classic standard keys and the newer
//   service-account-bound authorization keys AI Studio now creates by
//   default. It is never put in a URL, never logged, and never included in
//   an AiServiceError message.
// - Nothing here assumes a key's length, prefix ("AIza…") or character set;
//   `normalizeApiKey` only strips invisible paste noise and
//   `looksLikeApiKey` only rejects obvious junk such as a pasted URL.
// - Every error message leaving this file passes through redactSecret(),
//   so even a hypothetical provider response echoing the key shows
//   "[redacted]" in the UI.
// - Raw caught errors (network/DOM exceptions) are never forwarded — only
//   fixed, generic strings — so no underlying error object can leak.
// - Prompts and system instructions are sanitized + length-capped here so
//   malformed input can't produce an unbounded or broken request.

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const PREFERRED_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-2.5-flash-lite",
];

interface GeminiModel {
  name?: string;
  supportedGenerationMethods?: string[];
}

// Model availability varies by API key, project, billing configuration, and
// region. Resolve it from Google's API instead of assuming every key can use
// one hard-coded model.
async function resolveModel(apiKey: string): Promise<string> {
  let response: Response;
  try {
    incrementCloudRequestCount();
    response = await fetch(BASE_URL, {
      headers: { "x-goog-api-key": apiKey },
    });
  } catch {
    throw new AiServiceError(
      "Couldn't reach Gemini — check your internet connection."
    );
  }

  if (!response.ok) {
    // Let the generation request return the more specific API error below.
    return PREFERRED_MODELS[0];
  }

  let data: { models?: GeminiModel[] };
  try {
    data = await response.json();
  } catch {
    // Non-JSON body — fall back and let generateContent surface the real error.
    return PREFERRED_MODELS[0];
  }
  const available = (data.models ?? [])
    .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
    .map((model) => model.name?.replace(/^models\//, ""))
    .filter((name): name is string => Boolean(name));

  const preferred = PREFERRED_MODELS.find((model) => available.includes(model));
  if (preferred) return preferred;

  // A key may be granted access to a newer Flash model before the preferred
  // model. Avoid image, audio, and Live API-only variants for this text API.
  const compatibleFlashModel = available.find(
    (model) =>
      /flash/i.test(model) && !/(image|live|tts|audio)/i.test(model)
  );
  if (compatibleFlashModel) return compatibleFlashModel;

  throw new AiServiceError(
    "This API key cannot access a Gemini text model. In Google AI Studio, create a Gemini API key for a project with Gemini API access, then save that key here."
  );
}

async function readErrorMessage(
  response: Response,
  apiKey: string
): Promise<string | undefined> {
  try {
    const data = await response.json();
    const message = data?.error?.message;
    // Redact before this string is ever shown in the UI.
    return typeof message === "string" ? redactSecret(message, apiKey) : undefined;
  } catch {
    return undefined;
  }
}

interface GenerateOptions {
  apiKey: string | null;
  systemInstruction?: string;
  prompt: string;
  jsonResponse?: boolean;
}

export async function generateText({
  apiKey,
  systemInstruction,
  prompt,
  jsonResponse,
}: GenerateOptions): Promise<string> {
  // Normalize once at this choke point: repairs paste whitespace, guarantees
  // the value we put in the header is the clean key and nothing else.
  const key = normalizeApiKey(apiKey);
  if (!key) {
    throw new AiServiceError(
      "Add your Gemini API key first (AI Companion → Bring Your Own API Key)."
    );
  }

  // Reject empty/malformed input here so it can never reach the network.
  const cleanPrompt = sanitizePrompt(prompt);
  if (!cleanPrompt) {
    throw new AiServiceError(
      "There was nothing to send — add some text first."
    );
  }
  const cleanSystem = systemInstruction
    ? sanitizeText(systemInstruction, MAX_SYSTEM_CHARS)
    : undefined;

  const model = await resolveModel(key);
  // Model access can differ between keys and projects — including the newer
  // service-account-bound keys Google AI Studio now issues by default. If
  // the resolved model turns out to be unavailable to this key, fall back
  // through the preferred list instead of failing outright.
  const candidates = [model, ...PREFERRED_MODELS.filter((m) => m !== model)];

  const baseBody: any = {
    contents: [{ role: "user", parts: [{ text: cleanPrompt }] }],
  };
  if (cleanSystem) {
    baseBody.systemInstruction = { parts: [{ text: cleanSystem }] };
  }
  if (jsonResponse) {
    baseBody.generationConfig = { responseMimeType: "application/json" };
  }

  // 3.8 Flash defaults to "medium" thinking, which spends extra tokens and
  // delays the first character. Per the generateContent reference the control
  // lives at generationConfig.thinkingConfig.thinkingLevel (enum MINIMAL/LOW/
  // MEDIUM/HIGH), so we ask for "low" — and only for that model.
  const buildBody = (useThinkingConfig: boolean): any => {
    const body: any = { ...baseBody };
    if (useThinkingConfig) {
      body.generationConfig = {
        ...(body.generationConfig ?? {}),
        thinkingConfig: { thinkingLevel: "LOW" },
      };
    }
    return body;
  };

  let res: Response | null = null;
  for (const candidate of candidates) {
    const wantsThinkingConfig = candidate === "gemini-3.8-flash";
    const send = async (useThinkingConfig: boolean): Promise<Response> => {
      try {
        incrementCloudRequestCount();
        return await fetch(`${BASE_URL}/${candidate}:generateContent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key,
          },
          body: JSON.stringify(buildBody(useThinkingConfig)),
        });
      } catch {
        // Deliberately does not forward the caught error — only a fixed string.
        throw new AiServiceError(
          "Couldn't reach Gemini — check your internet connection."
        );
      }
    };

    let attempt = await send(wantsThinkingConfig);
    if (wantsThinkingConfig && attempt.status === 400) {
      // Safety net: this thinking hint is an optional speed tweak, so if the
      // API refuses it, retry the identical request without it. An optional
      // optimization can never take the feature down.
      attempt = await send(false);
    }
    res = attempt;
    // 404 here means the model isn't offered to this key — try the next one.
    if (attempt.status !== 404) break;
  }
  const response = res!;

  if (!response.ok) {
    const apiMessage = await readErrorMessage(response, key);
    if (response.status === 400) {
      throw new AiServiceError(
        apiMessage ?? "Gemini rejected the request — check the prompt and try again."
      );
    }
    if (response.status === 403) {
      throw new AiServiceError(
        apiMessage ?? "Gemini rejected the API key — double-check the key and its project permissions."
      );
    }
    if (response.status === 404) {
      throw new AiServiceError(
        apiMessage ??
          "Gemini could not find a model available to this API key. Create a Gemini API key in Google AI Studio and try again."
      );
    }
    if (response.status === 429) {
      throw new AiServiceError(
        "Gemini's free-tier rate limit was hit — wait a moment and try again."
      );
    }
    throw new AiServiceError(
      apiMessage ?? `Gemini request failed (${response.status}).`
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new AiServiceError(
      "Gemini returned an unexpected response — try again in a moment."
    );
  }
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new AiServiceError("Gemini returned an empty response.");
  }
  return text;
}
