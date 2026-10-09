import AsyncStorage from "@react-native-async-storage/async-storage";

const MIGRATION_KEY = "strix:migration:knovera-storage-v1";

const LEGACY_STORAGE_KEYS = [
  "knovera_onboarding_complete",
  "knovera:ai:conversations:v1",
  "knovera_deadlines",
  "knovera:nodes:v1",
  "knovera:profile:v1",
  "knovera:study-sessions:v1",
  "knovera:theme-preference:v1",
  "knovera:ai-runtime:v1",
] as const;

export async function migrateLegacyStorage() {
  if (await AsyncStorage.getItem(MIGRATION_KEY)) return;

  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    const currentKey = legacyKey.replace(/^knovera(?=[:_])/, "strix");
    const [currentValue, legacyValue] = await Promise.all([
      AsyncStorage.getItem(currentKey),
      AsyncStorage.getItem(legacyKey),
    ]);
    if (currentValue === null && legacyValue !== null) {
      await AsyncStorage.setItem(currentKey, legacyValue);
    }
  }

  // Old keys deliberately remain in storage as a rollback/recovery copy.
  await AsyncStorage.setItem(MIGRATION_KEY, "complete");
}
