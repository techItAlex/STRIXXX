import { AppState, Platform } from "react-native";
import { MAX_SYSTEM_CHARS, sanitizePrompt, sanitizeText } from "./sanitize";
import { LOCAL_AI_CONFIG, LOCAL_MODEL_RELATIVE_PATH } from "./localConfig";
import { setLocalModelStatus, setLocalTokensPerSecond } from "./aiRuntime";

const ANDROID_MODEL_PATH = `file:///data/user/0/com.strix.app/files/${LOCAL_MODEL_RELATIVE_PATH}`;
let context: any = null;
let loading: Promise<any> | null = null;
let appStateSubscription: { remove: () => void } | null = null;

export function getFixedModelPath() {
  if (Platform.OS !== "android") throw new Error("The local smoke test currently supports Android only.");
  return ANDROID_MODEL_PATH;
}

export async function loadLocalModel(modelPath = getFixedModelPath()) {
  if (context) return context;
  if (loading) return loading;
  setLocalModelStatus("loading");
  loading = (async () => {
    try {
      // Dynamic import keeps the native JSI module out of Expo Go's startup path.
      const llama = await import("llama.rn");
      const next = await llama.initLlama({
        model: modelPath,
        n_ctx: LOCAL_AI_CONFIG.contextSize,
        n_threads: LOCAL_AI_CONFIG.threads,
        n_gpu_layers: 0,
      });
      context = next;
      setLocalModelStatus("loaded");
      if (!appStateSubscription) {
        appStateSubscription = AppState.addEventListener("change", (state) => {
          if (state !== "active") void unloadLocalModel();
        });
      }
      return next;
    } catch (error) {
      setLocalModelStatus("error");
      throw new Error(error instanceof Error ? error.message : "Could not load the on-device model.");
    } finally {
      loading = null;
    }
  })();
  return loading;
}

export async function unloadLocalModel() {
  if (!context) return;
  const current = context;
  context = null;
  await current.release();
  setLocalModelStatus("not-loaded");
}

export async function generateLocalText({
  systemInstruction,
  prompt,
  onToken,
  jsonSchema,
}: {
  systemInstruction?: string;
  prompt: string;
  onToken?: (token: string) => void;
  jsonSchema?: object;
}): Promise<string> {
  const cleanPrompt = sanitizePrompt(prompt);
  if (!cleanPrompt) throw new Error("There was nothing to send — add some text first.");
  const cleanSystem = systemInstruction
    ? sanitizeText(systemInstruction, Math.min(MAX_SYSTEM_CHARS, LOCAL_AI_CONFIG.systemPromptBudget))
    : undefined;
  const model = await loadLocalModel();
  const started = Date.now();
  let tokenCount = 0;
  const result = await model.completion({
    messages: [
      ...(cleanSystem ? [{ role: "system", content: cleanSystem }] : []),
      { role: "user", content: cleanPrompt },
    ],
    n_predict: LOCAL_AI_CONFIG.maxTokens,
    ...(jsonSchema ? { response_format: { type: "json_schema", json_schema: { strict: true, schema: jsonSchema } } } : {}),
  }, onToken ? (data: { token?: string }) => {
    if (data.token) { tokenCount += 1; onToken(data.token); }
  } : undefined);
  const elapsedSeconds = Math.max((Date.now() - started) / 1000, 0.001);
  setLocalTokensPerSecond(tokenCount / elapsedSeconds);
  if (!result.text) throw new Error("The on-device model returned an empty response.");
  return result.text;
}
