import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../context/ThemeContext";
import HomeScreen from "../screens/HomeScreen";
import TreeScreen from "../screens/TreeScreen";
import CreateScreen from "../screens/CreateScreen";
import TimerScreen from "../screens/TimerScreen";
import { BrandIcon } from "../branding/Brand";
import AiStack from "./AiStack";

const Tab = createBottomTabNavigator();

export default function MainTabs({ initialRouteName = "Home" }: { initialRouteName?: string }) {
  const colors = useColors();
  return (
    <Tab.Navigator initialRouteName={initialRouteName}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: 18,
          paddingTop: 8,
          height: 68,
        },
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 11 },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, any> = {
            Home: "home", Tree: "tree", Create: "create", AI: "ai", Timer: "timer",
          };
          return <BrandIcon name={icons[route.name]} size={size ?? 20} active={color === colors.accentTeal} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tree" component={TreeScreen} />
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="AI" component={AiStack} />
      <Tab.Screen name="Timer" component={TimerScreen} />
    </Tab.Navigator>
  );
}
