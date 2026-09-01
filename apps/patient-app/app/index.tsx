import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { useAuth } from "@/features/auth/AuthProvider";
import { hasSeenOnboarding } from "@/lib/onboarding";

export default function SplashScreen() {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    let cancelled = false;
    (async () => {
      const seenOnboarding = await hasSeenOnboarding();
      if (cancelled) return;

      if (!seenOnboarding) {
        router.replace("/onboarding");
      } else if (!session) {
        router.replace("/(auth)/login");
      } else {
        router.replace("/(tabs)");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, session]);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>DC</Text>
      </View>
      <Text style={styles.appName}>Doctor Connect</Text>
      <Text style={styles.tagline}>Your Health. Your Doctor. Your Time.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background.default,
    gap: theme.spacing.sm,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  logoText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
  },
  appName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  tagline: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});
