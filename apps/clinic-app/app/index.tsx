import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { useAuth } from "@/features/auth/AuthProvider";

export default function IndexScreen() {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(session ? "/(tabs)" : "/login");
  }, [isLoading, session]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary[500]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background.default,
  },
});
