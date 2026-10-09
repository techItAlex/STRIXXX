import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export type AiMode = "local" | "cloud";
export type LocalModelStatus = "not-loaded" | "loading" | "loaded" | "error";
const STORAGE_KEY = "strix:ai-runtime:v1";

type RuntimeState = {
  mode: AiMode;
  modelStatus: LocalModelStatus;
  tokensPerSecond: number | null;
  cloudRequests: number;
  ready: boolean;
};

let state: RuntimeState = { mode: "local", modelStatus: "not-loaded", tokensPerSecond: null, cloudRequests: 0, ready: false };
const listeners = new Set<() => void>();
let loadStarted = false;
function notify() { listeners.forEach((listener) => listener()); }

function load() {
  if (loadStarted) return;
  loadStarted = true;
  AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.mode === "local" || saved.mode === "cloud") state.mode = saved.mode;
    }
  }).catch(() => {}).finally(() => { state.ready = true; notify(); });
}

function persist() { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: state.mode })).catch(() => {}); }
export function getAiRuntime() { load(); return state; }
export function subscribeAiRuntime(listener: () => void) { load(); listeners.add(listener); return () => { listeners.delete(listener); }; }
export function setAiMode(mode: AiMode) { state.mode = mode; persist(); notify(); }
export function setLocalModelStatus(modelStatus: LocalModelStatus) { state.modelStatus = modelStatus; notify(); }
export function setLocalTokensPerSecond(tokensPerSecond: number | null) { state.tokensPerSecond = tokensPerSecond; notify(); }
export function incrementCloudRequestCount() { state.cloudRequests += 1; notify(); }

export function useAiRuntime() {
  const [, refresh] = useState(0);
  useEffect(() => subscribeAiRuntime(() => refresh((value) => value + 1)), []);
  return getAiRuntime();
}

export function isAiAvailable(apiKey: string | null): boolean {
  const runtime = getAiRuntime();
  return runtime.mode === "local" || Boolean(apiKey?.trim());
}
