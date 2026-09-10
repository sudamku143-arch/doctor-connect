import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";

const ICONS_FILLED: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "home",
  appointments: "calendar",
  search: "search",
  notifications: "notifications",
  profile: "person",
};
const ICONS_OUTLINE: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "home-outline",
  appointments: "calendar-outline",
  search: "search-outline",
  notifications: "notifications-outline",
  profile: "person-outline",
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: { borderTopColor: theme.colors.border.default },
        tabBarLabelStyle: { fontSize: 11, fontWeight: theme.fontWeight.medium as any },
        tabBarItemStyle: { paddingHorizontal: 2 },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={(focused ? ICONS_FILLED[route.name] : ICONS_OUTLINE[route.name]) ?? "ellipse-outline"}
            color={color}
            size={size}
          />
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
