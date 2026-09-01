import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "home",
  appointments: "calendar",
  search: "search",
  notifications: "notifications",
  profile: "person",
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: { borderTopColor: theme.colors.border.default },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name] ?? "ellipse"} color={color} size={size} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="appointments" options={{ title: "Appointments" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="notifications" options={{ title: "Notifications" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
