import { getAiRuntime } from "./aiRuntime";
import { generateLocalText } from "./localProvider";
import { generateText as generateGeminiText } from "./geminiProvider";

type GenerateOptions = {
  apiKey: string | null;
  systemInstruction?: string;
  prompt: string;
  jsonResponse?: boolean;
  jsonSchema?: object;
  onToken?: (token: string) => void;
};

export async function generateText(options: GenerateOptions): Promise<string> {
  if (getAiRuntime().mode === "local") {
    return generateLocalText(options);
  }
  return generateGeminiText(options);
}
