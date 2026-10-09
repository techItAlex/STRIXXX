import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { looksLikeApiKey, normalizeApiKey } from "../services/ai/sanitize";

// The API key lives ONLY here (SecureStore → OS Keychain/Keystore) and in
// geminiProvider when a request actually goes out. It is never written to
// AsyncStorage, never logged, and never rendered in the UI (the ApiKey input
// uses secureTextEntry).

const KEY_STORAGE_ID = "strix_gemini_api_key";
const LEGACY_KEY_STORAGE_ID = "knovera_gemini_api_key";

interface ApiKeyContextValue {
  apiKey: string | null;
  loading: boolean;
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
  hasKey: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null);

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let stored = await SecureStore.getItemAsync(KEY_STORAGE_ID);
        if (!stored) {
          stored = await SecureStore.getItemAsync(LEGACY_KEY_STORAGE_ID);
          if (stored) await SecureStore.setItemAsync(KEY_STORAGE_ID, stored);
        }
        setApiKeyState(stored ? normalizeApiKey(stored) : stored);
      } catch {
        // Log a fixed string only — never the error object, so no key
        // material (or anything derived from it) can reach console output.
        console.warn("STRIX: could not read the stored API key");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setApiKey = async (key: string) => {
    const clean = normalizeApiKey(key);
    if (!looksLikeApiKey(clean)) {
      throw new Error(
        "That doesn't look like a Gemini API key. Paste the full key from Google AI Studio."
      );
    }
    await SecureStore.setItemAsync(KEY_STORAGE_ID, clean);
    setApiKeyState(clean);
  };

  const clearApiKey = async () => {
    await SecureStore.deleteItemAsync(KEY_STORAGE_ID);
    setApiKeyState(null);
  };

  return (
    <ApiKeyContext.Provider
      value={{
        apiKey,
        loading,
        setApiKey,
        clearApiKey,
        hasKey: !!apiKey,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error("useApiKey must be used within an ApiKeyProvider");
  return ctx;
}
