import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs from "./MainTabs";
import QuickNoteInputScreen from "../screens/QuickNote/QuickNoteInputScreen";import QuickNoteFieldScreen from "../screens/QuickNote/QuickNoteFieldScreen";
import QuickNoteContentScreen from "../screens/QuickNote/QuickNoteContentScreen";
import QuickNoteSuccessScreen from "../screens/QuickNote/QuickNoteSuccessScreen";
import NodeDetailScreen from "../screens/NodeDetailScreen";
import AiChatScreen from "../screens/AI/AiChatScreen";
import JudgeUnderstandingScreen from "../screens/AI/JudgeUnderstandingScreen";
import AiOrganizeScreen from "../screens/AI/AiOrganizeScreen";
import ApiKeyScreen from "../screens/AI/ApiKeyScreen";
import { useColors } from "../context/ThemeContext";
import SettingsScreen from "../screens/SettingsScreen";
import AboutScreen from "../screens/Settings/AboutScreen";
import HowToUseScreen from "../screens/Settings/HowToUseScreen";
import FaqScreen from "../screens/Settings/FaqScreen";
import PrivacyPolicyScreen from "../screens/Settings/PrivacyPolicyScreen";
import TermsOfUseScreen from "../screens/Settings/TermsOfUseScreen";
import StudySpaceScreen from "../screens/StudySpaceScreen";
import LocalSmokeTestScreen from "../screens/AI/LocalSmokeTestScreen";
import CalendarScreen from "../screens/CalendarScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator({ initialTab = "Home" }: { initialTab?: string }) {
  const colors = useColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MainTabs">{() => <MainTabs initialRouteName={initialTab} />}</Stack.Screen>
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="QuickNoteInput" component={QuickNoteInputScreen} />
        <Stack.Screen name="QuickNoteField" component={QuickNoteFieldScreen} />
        <Stack.Screen name="QuickNoteContent" component={QuickNoteContentScreen} />
        <Stack.Screen name="QuickNoteSuccess" component={QuickNoteSuccessScreen} />
        <Stack.Screen name="NodeDetail" component={NodeDetailScreen} />
        <Stack.Screen name="StudySpace" component={StudySpaceScreen} />
        <Stack.Screen name="AiChat" component={AiChatScreen} />
        <Stack.Screen name="JudgeUnderstanding" component={JudgeUnderstandingScreen} />
        <Stack.Screen name="AiOrganize" component={AiOrganizeScreen} />
        <Stack.Screen name="ApiKey" component={ApiKeyScreen} />
        <Stack.Screen name="LocalSmokeTest" component={LocalSmokeTestScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="HowToUse" component={HowToUseScreen} />
        <Stack.Screen name="Faq" component={FaqScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
