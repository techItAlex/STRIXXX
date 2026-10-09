import React, { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { migrateLegacyStorage } from "./src/services/storageMigration";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NodeProvider } from "./src/context/NodeContext";
import { ProfileProvider } from "./src/context/ProfileContext";
import { ApiKeyProvider } from "./src/context/ApiKeyContext";
import { AiConversationProvider } from "./src/context/AiConversationContext";
import { StudyProvider } from "./src/context/StudyContext";
import { DeadlineProvider } from "./src/context/DeadlineContext";
import { ThemeProvider, useThemePreference } from "./src/context/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";
import OnboardingScreen, { SplashScreen } from "./src/screens/OnboardingScreen";

const ONBOARDING_STORAGE_KEY = "strix_onboarding_complete";

export default function App() {
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    migrateLegacyStorage().finally(() => setStorageReady(true));
  }, []);

  if (!storageReady) return <SplashScreen />;
  return <ThemeProvider><StrixApp /></ThemeProvider>;
}

function StrixApp() {
  const { resolvedTheme, colors, ready } = useThemePreference();
  const [launchState, setLaunchState] = useState<"loading" | "splash" | "onboarding" | "app">("loading");
  const [initialTab, setInitialTab] = useState("Home");
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Derived straight from context so it can never lag one toggle behind the
  // palette (the old version read a mutable singleton mutated in an effect).
  const navigationTheme = useMemo(() => ({
    ...(resolvedTheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(resolvedTheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      border: colors.border,
      text: colors.text,
      primary: colors.accentTeal,
      notification: colors.accentRed,
    },
  }), [resolvedTheme, colors]);

  useEffect(() => {
    // Wait for the stored theme so the first paint isn't a dark flash that
    // immediately re-renders for users who saved "light".
    if (!ready) return;
    const prepareLaunch = async () => {
      const completed = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      setHasCompletedOnboarding(Boolean(completed));
      setLaunchState("splash");
    };
    prepareLaunch().catch(() => setLaunchState("onboarding"));
  }, [ready]);

  const finishOnboarding = (openAi: boolean) => {
    // Navigation should not be held up if local persistence is temporarily unavailable.
    AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true").catch(() => {});
    setInitialTab(openAi ? "AI" : "Home");
    setLaunchState("app");
  };

  const continueFromSplash = () => {
    setLaunchState(hasCompletedOnboarding ? "app" : "onboarding");
  };

  if (launchState === "loading") return <SplashScreen />;
  if (launchState === "splash") return <SplashScreen onContinue={continueFromSplash} />;
  if (launchState === "onboarding") return <OnboardingScreen onFinish={finishOnboarding} />;

  return (
    <SafeAreaProvider>
      <NodeProvider>
        <ProfileProvider>
          <ApiKeyProvider>
            <StudyProvider>
              <DeadlineProvider>
              <AiConversationProvider>
                <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
                <NavigationContainer theme={navigationTheme}>
                  <RootNavigator initialTab={initialTab} />
                </NavigationContainer>
              </AiConversationProvider>
              </DeadlineProvider>
            </StudyProvider>
          </ApiKeyProvider>
        </ProfileProvider>
      </NodeProvider>
    </SafeAreaProvider>
  );
}
