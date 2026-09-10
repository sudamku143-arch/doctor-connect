import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import {
  ConfirmationModal,
  ErrorState,
  LoadingState,
  PrimaryButton,
  SecondaryButton,
  TextField,
} from "@doctor-connect/ui-native";
import type { Gender, Patient, Profile } from "@doctor-connect/types";
import { useAuth } from "@/features/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { getGenderAvatarUrl } from "@/lib/genderAvatar";
import { getMyPatientRecord, getMyProfile, updateMyEmail, updateMyPatientRecord, updateMyProfile } from "@/lib/api/profile";
import { getPushNotificationsEnabled, setPushNotificationsEnabled } from "@/lib/api/notifications";

const GENDERS: Gender[] = ["MALE", "FEMALE", "OTHER"];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [pushEnabled, setPushEnabledState] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    Promise.all([getMyProfile(), getMyPatientRecord(), getPushNotificationsEnabled()])
      .then(([profileData, patientData, pushOn]) => {
        setProfile(profileData);
        setPatient(patientData);
        setFullName(profileData.full_name);
        setEmail(profileData.email ?? "");
        setPhone(profileData.phone ?? "");
        setDateOfBirth(patientData.date_of_birth ?? "");
        setGender(patientData.gender ?? "MALE");
        setPushEnabledState(pushOn);
      })
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  function startEditing() {
    setSaveError(null);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const emailChanged = !!email && email !== profile?.email;
      await updateMyProfile({ fullName, phone: phone || null, email: emailChanged ? email : undefined });
      if (emailChanged) {
        await updateMyEmail(email);
      }
      await updateMyPatientRecord({ dateOfBirth: dateOfBirth || null, gender });
      setProfile((prev) => (prev ? { ...prev, full_name: fullName, phone, email } : prev));
      setPatient((prev) => (prev ? { ...prev, date_of_birth: dateOfBirth || null, gender } : prev));
      setEditing(false);
      setSavedMessage("Profile updated");
      setTimeout(() => setSavedMessage(null), 2500);
    } catch {
      setSaveError("Could not save your profile. Please try again.");
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
    setShowLogoutConfirm(false);
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  if (loading) return <LoadingState title="Loading profile…" />;
  if (error && !profile) return <ErrorState title={error} />;

  const displayGender = editing ? gender : (patient?.gender ?? undefined);
  const avatarUrl = getGenderAvatarUrl(displayGender);
  const isEmailVerified = !!session?.user.email_confirmed_at;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.sm }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerSide}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.headerSide} />
      </View>

      <LinearGradient
        colors={[theme.colors.primary[400], theme.colors.primary[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileCard}
      >
        {!editing ? (
          <Pressable onPress={startEditing} hitSlop={8} style={styles.editIconButton}>
            <Ionicons name="pencil" size={16} color={theme.colors.text.inverse} />
          </Pressable>
        ) : null}

        <View style={styles.avatarRing}>
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        </View>

        {editing ? (
          <View style={styles.editForm}>
            <TextField label="Full name" value={fullName} onChangeText={setFullName} />
            <TextField label="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <TextField label="Mobile number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

            <Pressable onPress={() => setShowDatePicker(true)}>
              <View pointerEvents="none">
                <TextField label="Date of birth" placeholder="Select date of birth" value={dateOfBirth} editable={false} />
              </View>
            </Pressable>
            {showDatePicker ? (
              <DateTimePicker
                value={dateOfBirth ? new Date(dateOfBirth) : new Date(1990, 0, 1)}
                mode="date"
                maximumDate={new Date()}
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (event.type === "set" && selectedDate) {
                    setDateOfBirth(selectedDate.toISOString().slice(0, 10));
                  }
                }}
              />
            ) : null}

            <View style={styles.genderRow}>
              {GENDERS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setGender(option)}
                  style={[styles.genderButton, gender === option && styles.genderButtonActive]}
                >
                  <Text style={[styles.genderLabel, gender === option && styles.genderLabelActive]} numberOfLines={1}>
                    {option.charAt(0) + option.slice(1).toLowerCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}

            <View style={styles.editActions}>
              <SecondaryButton label="Cancel" onPress={() => setEditing(false)} style={styles.editButton} />
              <PrimaryButton label="Save" onPress={handleSave} loading={saving} style={styles.editButton} />
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.name}>{profile?.full_name || "Add your name"}</Text>
            <View style={styles.emailRow}>
              <Text style={styles.email}>{profile?.email || session?.user.email}</Text>
              {isEmailVerified ? (
                <Ionicons name="checkmark-circle" size={15} color={theme.colors.text.inverse} />
              ) : null}
            </View>
            {savedMessage ? <Text style={styles.savedMessage}>{savedMessage}</Text> : null}
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Patient</Text>
            </View>
          </>
        )}
      </LinearGradient>

      <SectionLabel label="ACCOUNT" />
      <Card>
        <RowLink icon="people" label="Family Members" onPress={() => router.push("/profile/family-members")} />
        <RowLink icon="calendar" label="Appointment History" onPress={() => router.push("/(tabs)/appointments")} last />
      </Card>

      <SectionLabel label="PREFERENCES" />
      <Card>
        <View style={[styles.rowLink, styles.rowLinkLast]}>
          <View style={styles.rowLinkLeft}>
            <RowIcon icon="notifications" />
            <Text style={styles.rowLinkLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Push Notifications
            </Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={handleTogglePush}
            trackColor={{ true: theme.colors.primary[500] }}
          />
        </View>
      </Card>

      <SectionLabel label="SUPPORT" />
      <Card>
        <RowLink icon="shield-checkmark" label="Privacy Policy" onPress={() => router.push("/legal/privacy")} />
        <RowLink icon="document-text" label="Terms of Service" onPress={() => router.push("/legal/terms")} />
        <RowLink icon="help-circle" label="Help & Support" onPress={() => router.push("/help-support")} last />
      </Card>

      <Pressable style={styles.logoutButton} onPress={() => setShowLogoutConfirm(true)}>
        <Ionicons name="log-out-outline" size={20} color={theme.colors.primary[700]} />
        <Text style={styles.logoutLabel}>Logout</Text>
      </Pressable>

      <ConfirmationModal
        visible={showLogoutConfirm}
        title="Log out?"
        description="Are you sure you want to logout?"
        confirmLabel="Logout"
        danger
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </ScrollView>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function RowIcon({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.rowIconCircle}>
      <Ionicons name={icon} size={17} color={theme.colors.primary[600]} />
    </View>
  );
}

function RowLink({
  icon,
  label,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.rowLink, last && styles.rowLinkLast]}>
      <View style={styles.rowLinkLeft}>
        <RowIcon icon={icon} />
        <Text style={styles.rowLinkLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={theme.iconSizes.sm} color={theme.colors.text.tertiary} style={styles.rowChevron} />
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
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
  },
  headerSide: {
    width: 32,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  profileCard: {
    borderRadius: 20,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  editIconButton: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 30,
    height: 30,
    borderRadius: theme.radii.pill,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: theme.radii.pill,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: theme.spacing.sm,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.inverse,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  email: {
    fontSize: theme.fontSize.sm,
    color: "rgba(255,255,255,0.85)",
  },
  savedMessage: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.inverse,
    marginTop: theme.spacing.xxs,
  },
  roleBadge: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.radii.pill,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  roleBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.primary[700],
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
  genderRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  genderButton: {
    flex: 1,
    paddingHorizontal: theme.spacing.xxs,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
  },
  genderButtonActive: {
    backgroundColor: theme.colors.text.inverse,
    borderColor: theme.colors.text.inverse,
  },
  genderLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.inverse,
  },
  genderLabelActive: {
    color: theme.colors.primary[700],
    fontWeight: theme.fontWeight.semibold as any,
  },
  saveErrorText: {
    fontSize: theme.fontSize.sm,
    color: "#FFD9D9",
  },
  sectionLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.xxs,
  },
  card: {
    borderRadius: 18,
    backgroundColor: theme.colors.surface.default,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
    gap: theme.spacing.sm,
  },
  rowLinkLast: {
    borderBottomWidth: 0,
  },
  rowLinkLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  rowIconCircle: {
    width: 34,
    height: 34,
    flexShrink: 0,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  rowLinkLabel: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },
  rowChevron: {
    flexShrink: 0,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[50],
  },
  logoutLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.primary[700],
  },
});
