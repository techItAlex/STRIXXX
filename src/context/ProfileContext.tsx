import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sanitizeDisplayName } from "../utils/text";

const STORAGE_KEY = "strix:profile:v1";

// A display name is a local UI label, not a secret or a credential — it
// belongs in AsyncStorage with the rest of the app's non-sensitive settings.
// The only credential in the app (the Gemini key) stays in SecureStore.

interface ProfileContextValue {
  displayName: string;
  ready: boolean;
  setDisplayName: (name: string) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [displayName, setDisplayNameState] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setDisplayNameState(sanitizeDisplayName(raw)))
      .catch(() => console.warn("STRIX: could not load your display name"))
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      displayName,
      ready,
      setDisplayName: (next: string) => {
        const clean = sanitizeDisplayName(next);
        setDisplayNameState(clean);
        AsyncStorage.setItem(STORAGE_KEY, clean).catch(() =>
          console.warn("STRIX: failed to save your display name")
        );
      },
    }),
    [displayName, ready]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
