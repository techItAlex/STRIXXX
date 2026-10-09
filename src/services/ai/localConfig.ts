export const LOCAL_AI_CONFIG = {
  modelFileName: "strix-model.gguf",
  contextSize: 2048,
  maxTokens: 384,
  threads: 4,
  systemPromptBudget: 1200,
} as const;

export const LOCAL_MODEL_RELATIVE_PATH = `ai/${LOCAL_AI_CONFIG.modelFileName}`;
