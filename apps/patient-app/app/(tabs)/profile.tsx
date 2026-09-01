import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { SecondaryButton } from "@doctor-connect/ui-native";
import { useAuth } from "@/features/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";

export default function ProfileScreen() {
  const { session } = useAuth();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>
            {(session?.user.user_metadata?.full_name as string | undefined)?.charAt(0)?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text style={styles.name}>{(session?.user.user_metadata?.full_name as string) || "Your profile"}</Text>
        <Text style={styles.email}>{session?.user.email}</Text>

        <SecondaryButton label="Logout" onPress={handleLogout} style={styles.logoutButton} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.xxs,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  avatarInitial: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.primary[700],
  },
  name: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  email: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
  },
  logoutButton: {
    marginTop: theme.spacing.xxl,
  },
});
