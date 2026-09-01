import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { ErrorState, LoadingState, PrimaryButton, SecondaryButton, TextField } from "@doctor-connect/ui-native";
import type { Profile } from "@doctor-connect/types";
import { useAuth } from "@/features/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { getMyProfile, updateMyProfile } from "@/lib/api/profile";
import { getPushNotificationsEnabled, setPushNotificationsEnabled } from "@/lib/api/notifications";

export default function ProfileScreen() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [pushEnabled, setPushEnabledState] = useState(true);

  useEffect(() => {
    Promise.all([getMyProfile(), getPushNotificationsEnabled()])
      .then(([data, pushOn]) => {
        setProfile(data);
        setFullName(data.full_name);
        setPhone(data.phone ?? "");
        setPushEnabledState(pushOn);
      })
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateMyProfile({ fullName, phone: phone || null });
      setProfile((prev) => (prev ? { ...prev, full_name: fullName, phone } : prev));
      setEditing(false);
    } catch {
      setError("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePush(value: boolean) {
    setPushEnabledState(value);
    try {
      await setPushNotificationsEnabled(value);
    } catch {
      setPushEnabledState(!value);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  if (loading) return <LoadingState title="Loading profile…" />;
  if (error && !profile) return <ErrorState title={error} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{profile?.full_name.charAt(0).toUpperCase() ?? "?"}</Text>
        </View>
        {editing ? (
          <View style={styles.editForm}>
            <TextField label="Full name" value={fullName} onChangeText={setFullName} />
            <TextField label="Mobile number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <View style={styles.editActions}>
              <SecondaryButton label="Cancel" onPress={() => setEditing(false)} style={styles.editButton} />
              <PrimaryButton label="Save" onPress={handleSave} loading={saving} style={styles.editButton} />
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.name}>{profile?.full_name}</Text>
            <Text style={styles.email}>{session?.user.email}</Text>
            {profile?.phone ? <Text style={styles.email}>{profile.phone}</Text> : null}
            <SecondaryButton label="Edit Profile" onPress={() => setEditing(true)} fullWidth={false} />
          </>
        )}
      </View>

      <Section>
        <RowLink icon="people-outline" label="Family Members" onPress={() => router.push("/profile/family-members")} />
        <RowLink icon="calendar-outline" label="Appointment History" onPress={() => router.push("/(tabs)/appointments")} />
      </Section>

      <Section>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Push Notifications</Text>
          <Switch
            value={pushEnabled}
            onValueChange={handleTogglePush}
            trackColor={{ true: theme.colors.primary[500] }}
          />
        </View>
        <RowLink icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => {}} />
        <RowLink icon="document-text-outline" label="Terms of Service" onPress={() => {}} />
        <RowLink icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
      </Section>

      <SecondaryButton label="Logout" onPress={handleLogout} style={styles.logoutButton} />
    </ScrollView>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

function RowLink({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.rowLink}>
      <View style={styles.rowLinkLeft}>
        <Ionicons name={icon} size={theme.iconSizes.md} color={theme.colors.text.secondary} />
        <Text style={styles.rowLinkLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={theme.iconSizes.sm} color={theme.colors.text.tertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  header: {
    alignItems: "center",
    gap: theme.spacing.xxs,
    paddingVertical: theme.spacing.lg,
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
  },
  editForm: {
    width: "100%",
    gap: theme.spacing.sm,
  },
  editActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  editButton: {
    flex: 1,
  },
  section: {
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    overflow: "hidden",
  },
  rowLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  rowLinkLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  rowLinkLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  switchLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
  logoutButton: {
    marginTop: theme.spacing.sm,
  },
});
