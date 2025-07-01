import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import WODScreen from "../../screens/WODScreen"; // or rename to WODScreen
import HistoryScreen from "../../screens/HistoryScreen";
import SettingsScreen from "../../screens/SettingsScreen";
import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "WOD") iconName = "barbell-outline";
          else if (route.name === "History") iconName = "time-outline";
          else iconName = "settings-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarActiveTintColor: "#1a73e8",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="WOD" component={WODScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
