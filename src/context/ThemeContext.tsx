import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import { Colors, getPalette } from "../theme/colors";

export type ThemePreference = "system" | "dark" | "light";
export type ResolvedTheme = "dark" | "light";

const STORAGE_KEY = "strix:theme-preference:v1";
const ThemeContext = createContext<{
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  colors: Colors;
  setPreference: (value: ThemePreference) => void;
  ready: boolean;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("dark");
  const [ready, setReady] = useState(false);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((value) => { if (value === "dark" || value === "light" || value === "system") setPreferenceState(value); }).finally(() => setReady(true)); }, []);
  const resolvedTheme: ResolvedTheme = preference === "system" ? (system === "light" ? "light" : "dark") : preference;
  // Stable module-level object per mode, so memoized styles only rebuild when the
  // resolved theme actually flips.
  const palette = getPalette(resolvedTheme);
  const value = useMemo(() => ({ preference, resolvedTheme, colors: palette, ready, setPreference: (next: ThemePreference) => { setPreferenceState(next); AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {}); } }), [preference, resolvedTheme, palette, ready]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useThemePreference must be used within ThemeProvider");
  return context;
}

/** The active palette. Components that read this re-render on theme changes. */
export function useColors(): Colors {
  return useThemePreference().colors;
}
