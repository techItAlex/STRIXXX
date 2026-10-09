import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AiHomeScreen from "../screens/AI/AiHomeScreen";
import AiToolsScreen from "../screens/AI/AiToolsScreen";
import { useColors } from "../context/ThemeContext";

const Stack = createNativeStackNavigator();

// These two screens stay inside the AI tab's own stack (rather than the
// root stack's modal group) specifically so the bottom tab bar remains
// visible on them, matching the mockups — unlike AiChat/JudgeUnderstanding/
// AiOrganize, which are full-screen modals with no tab bar.
export default function AiStack() {
  const colors = useColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="AiHome" component={AiHomeScreen} />
      <Stack.Screen name="AiTools" component={AiToolsScreen} />
    </Stack.Navigator>
  );
}
