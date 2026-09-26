import { useCallback, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { ErrorState, LoadingState, PrimaryButton, SecondaryButton, TextField } from "@doctor-connect/ui-native";
import type { Profile } from "@doctor-connect/types";
import { useAuth } from "@/features/auth/AuthProvider";
import { useClinic } from "@/features/clinic/ClinicContext";
import { DoctorIllustration } from "@/features/auth/DoctorIllustration";
import { supabase } from "@/lib/supabase/client";
import { getRoleAvatarUrl } from "@/lib/roleAvatar";
import { getMyProfile, updateMyProfile, uploadMyAvatar } from "@/lib/api/profile";
import {
  countPendingReschedules,
  countTodayAppointments,
  countUniquePatientsThisMonth,
  getClinicRating,
  type ClinicRating,
} from "@/lib/api/profileStats";
import { countActivitySince } from "@/lib/api/activity";
import { getActivityLastSeen } from "@/lib/activityLastSeen";

const ROW_TONE = {
  purple: { bg: theme.colors.primary[50], fg: theme.colors.primary[600] },
  blue: { bg: theme.colors.info[50], fg: theme.colors.info[500] },
  green: { bg: theme.colors.success[50], fg: theme.colors.success[500] },
  orange: { bg: theme.colors.warning[50], fg: theme.colors.warning[500] },
} as const;

export default function ReceptionistProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { staff, isLoading, error } = useClinic();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [unreadActivity, setUnreadActivity] = useState(0);

  const [stats, setStats] = useState({ today: 0, patients: 0, reschedules: 0 });
  const [rating, setRating] = useState<ClinicRating>({ average: null, count: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [clinicInfoExpanded, setClinicInfoExpanded] = useState(false);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getMyProfile()
        .then(setProfile)
        .catch(() => undefined);
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (!staff) return;
      getActivityLastSeen(staff.profile_id).then((lastSeen) => {
        countActivitySince(staff.clinic_id, lastSeen)
          .then(setUnreadActivity)
          .catch(() => undefined);
      });
      setStatsLoading(true);
      Promise.all([
        countTodayAppointments(staff.clinic_id),
        countUniquePatientsThisMonth(staff.clinic_id),
        countPendingReschedules(staff.clinic_id),
        getClinicRating(staff.clinic_id),
      ])
        .then(([today, patients, reschedules, clinicRating]) => {
          setStats({ today, patients, reschedules });
          setRating(clinicRating);
        })
        .catch(() => undefined)
        .finally(() => setStatsLoading(false));
    }, [staff]),
  );

  function startEditing() {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setSaveError(null);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await updateMyProfile({ fullName, phone: phone || null });
      setProfile((current) => (current ? { ...current, full_name: fullName, phone: phone || null } : current));
      setEditing(false);
    } catch {
      setSaveError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    setUploadingPhoto(true);
    try {
      const avatarUrl = await uploadMyAvatar(result.assets[0].base64);
      setProfile((current) => (current ? { ...current, avatar_url: avatarUrl } : current));
    } catch {
      Alert.alert("Upload failed", "Could not update your photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/login");
        },
      },
    ]);
  }

  if (isLoading) return <LoadingState title="Loading profile…" />;
  if (error || !staff) return <ErrorState title={error ?? "Not linked to a clinic yet."} />;

  const avatarUrl = profile?.avatar_url ?? getRoleAvatarUrl(staff.role);
  const emailVerified = Boolean(session?.user.email_confirmed_at);
  const clinicVerified = staff.clinic.verification_status === "VERIFIED";

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[...theme.heroGradient]}
        style={[styles.headerGradient, { paddingTop: insets.top + theme.spacing.md }]}
      >
        <View style={styles.illustrationWrap} pointerEvents="none">
          <DoctorIllustration width={180} height={150} />
        </View>
        <View style={styles.brandRow}>
          <View style={styles.brandLeft}>
            <View style={styles.logoBadge}>
              <Ionicons name="medical" size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brandName}>Doctor Connect</Text>
              <Text style={styles.brandTagline}>Better Care • Healthier Tomorrow</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <Pressable style={styles.headerIconButton} onPress={() => router.push("/activity")} hitSlop={6}>
              <Ionicons name="notifications-outline" size={19} color="#FFFFFF" />
              {unreadActivity > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadActivity > 9 ? "9+" : unreadActivity}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.headerIconButton} onPress={startEditing} hitSlop={6}>
              <Ionicons name="settings-outline" size={19} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xxxl }]}
      >
        <View style={styles.profileCard}>
          {editing ? (
            <View style={styles.editForm}>
              <TextField label="Full name" value={fullName} onChangeText={setFullName} />
              <TextField label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
              <View style={styles.editActions}>
                <SecondaryButton label="Cancel" onPress={() => setEditing(false)} style={styles.editActionButton} />
                <PrimaryButton label="Save" onPress={handleSave} loading={saving} style={styles.editActionButton} />
              </View>
            </View>
          ) : (
            <>
              <View style={styles.profileTopRow}>
                <View style={styles.avatarWrap}>
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  <Pressable style={styles.cameraButton} onPress={handlePickPhoto} disabled={uploadingPhoto} hitSlop={6}>
                    <Ionicons name="camera" size={13} color="#FFFFFF" />
                  </Pressable>
                </View>
                <View style={styles.identity}>
                  <Text style={styles.name} numberOfLines={1}>
                    {profile?.full_name ?? "Staff"}
                  </Text>
                  <Text style={styles.email} numberOfLines={1}>
                    {profile?.email ?? session?.user.email}
                  </Text>
                  <View style={styles.rolePill}>
                    <Text style={styles.rolePillText}>Clinic Staff</Text>
                  </View>
                </View>
              </View>
              <Pressable style={styles.editProfileButton} onPress={startEditing}>
                <Ionicons name="pencil" size={14} color={theme.colors.primary[700]} />
                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.card}>
          <InfoRow icon="ribbon-outline" tone="purple" label="Role" value={staff.role === "CLINIC_ADMIN" ? "Clinic Admin" : "Receptionist"} />
          <InfoRow
            icon="business-outline"
            tone="blue"
            label="Clinic Name"
            value={staff.clinic.name}
            onPress={() => router.push("/clinic-profile")}
          />
          {staff.clinic.phone ? (
            <InfoRow
              icon="call-outline"
              tone="green"
              label="Clinic Phone"
              value={staff.clinic.phone}
              badge={clinicVerified ? "Verified" : undefined}
              onPress={() => router.push("/clinic-profile")}
            />
          ) : null}
          <InfoRow
            icon="mail-outline"
            tone="orange"
            label="Email"
            value={profile?.email ?? session?.user.email ?? "—"}
            badge={emailVerified ? "Verified" : undefined}
            last
          />
        </View>

        <View style={styles.statsRow}>
          <ProfileStatCard icon="calendar" tone="purple" value={statsLoading ? "…" : stats.today} label="Today's Appointments" />
          <ProfileStatCard icon="people" tone="blue" value={statsLoading ? "…" : stats.patients} label="Patients This Month" />
          <ProfileStatCard icon="time" tone="green" value={statsLoading ? "…" : stats.reschedules} label="Pending Reschedules" />
          <ProfileStatCard
            icon="star"
            tone="orange"
            value={statsLoading ? "…" : (rating.average ?? "—")}
            label="Patient Rating"
            subtitle={rating.count > 0 ? `(${rating.count} Reviews)` : undefined}
          />
        </View>

        <View style={styles.card}>
          <Pressable style={styles.expandHeader} onPress={() => setClinicInfoExpanded((current) => !current)}>
            <View style={styles.expandIconCircle}>
              <Ionicons name="business" size={18} color={theme.colors.primary[600]} />
            </View>
            <View style={styles.expandInfo}>
              <Text style={styles.expandTitle}>Clinic Information</Text>
              <Text style={styles.expandSubtitle}>View clinic details, location & timings</Text>
            </View>
            <Ionicons name={clinicInfoExpanded ? "chevron-down" : "chevron-forward"} size={18} color={theme.colors.text.tertiary} />
          </Pressable>
          {clinicInfoExpanded ? (
            <View style={styles.tileGrid}>
              <ActionTile icon="business-outline" label="Clinic Profile" subtitle="View & edit" onPress={() => router.push("/clinic-profile")} />
              <ActionTile icon="time-outline" label="Working Hours" subtitle="Manage schedule" onPress={() => router.push("/(tabs)/schedule")} />
              <ActionTile icon="person-outline" label="Doctors" subtitle="View doctors" onPress={() => router.push("/doctors")} />
              <ActionTile icon="calendar-outline" label="Leave / Holiday" subtitle="Manage leave" onPress={() => router.push("/schedule/leave")} />
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <SettingsRow
            icon="notifications-outline"
            label="Notification Settings"
            subtitle="Appointments, reminders, updates"
            onPress={() => router.push("/activity")}
          />
          <SettingsRow icon="headset-outline" label="Help & Support" subtitle="FAQs, contact us" onPress={() => router.push("/support")} />
          <SettingsRow
            icon="information-circle-outline"
            label="About Doctor Connect"
            subtitle="Version 1.0.0"
            onPress={() => Alert.alert("Doctor Connect", "Version 1.0.0\nBetter Care • Healthier Tomorrow")}
            last
          />
        </View>

        <SecondaryButton label="Logout" icon="log-out-outline" onPress={handleLogout} tone="danger" />
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  tone,
  label,
  value,
  badge,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: keyof typeof ROW_TONE;
  label: string;
  value: string;
  badge?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const colors = ROW_TONE[tone];
  return (
    <Pressable style={[styles.infoRow, !last && styles.rowDivider]} onPress={onPress}>
      <View style={[styles.infoIconCircle, { backgroundColor: colors.bg }]}>
        <Ionicons name={icon} size={16} color={colors.fg} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueWrap}>
        <Text style={styles.infoValue} numberOfLines={1}>
          {value}
        </Text>
        {badge ? (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} /> : null}
    </Pressable>
  );
}

const STAT_TONE = {
  purple: { bg: theme.colors.primary[50], fg: theme.colors.primary[600], valueColor: theme.colors.primary[700] },
  blue: { bg: theme.colors.info[50], fg: theme.colors.info[500], valueColor: theme.colors.info[700] },
  green: { bg: theme.colors.success[50], fg: theme.colors.success[500], valueColor: theme.colors.success[700] },
  orange: { bg: theme.colors.warning[50], fg: theme.colors.warning[500], valueColor: theme.colors.warning[700] },
} as const;

function ProfileStatCard({
  icon,
  tone,
  value,
  label,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: keyof typeof STAT_TONE;
  value: string | number;
  label: string;
  subtitle?: string;
}) {
  const colors = STAT_TONE[tone];
  return (
    <View style={[styles.statCard, { backgroundColor: colors.bg }]}>
      <Ionicons name={icon} size={16} color={colors.fg} />
      <Text style={[styles.statValue, { color: colors.valueColor }]}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
      {subtitle ? (
        <Text style={styles.statSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function ActionTile({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionTile} onPress={onPress}>
      <View style={styles.actionTileIconCircle}>
        <Ionicons name={icon} size={18} color={theme.colors.primary[600]} />
      </View>
      <Text style={styles.actionTileLabel}>{label}</Text>
      <Text style={styles.actionTileSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable style={[styles.settingsRow, !last && styles.rowDivider]} onPress={onPress}>
      <View style={styles.settingsIconCircle}>
        <Ionicons name={icon} size={18} color={theme.colors.primary[600]} />
      </View>
      <View style={styles.settingsInfo}>
        <Text style={styles.settingsLabel}>{label}</Text>
        <Text style={styles.settingsSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  scroll: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  illustrationWrap: {
    position: "absolute",
    right: -40,
    top: -20,
    opacity: 0.16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    flexShrink: 1,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold as any,
    color: "#FFFFFF",
  },
  brandTagline: {
    fontSize: theme.fontSize.xs,
    color: "rgba(255,255,255,0.7)",
  },
  headerIcons: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.error[500],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: theme.heroGradient[1],
  },
  badgeText: {
    fontSize: 9,
    fontWeight: theme.fontWeight.bold as any,
    color: "#FFFFFF",
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  profileCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primary[50],
    gap: theme.spacing.md,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  avatarWrap: {
    width: 72,
    height: 72,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.default,
  },
  cameraButton: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.primary[50],
  },
  identity: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  email: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  rolePill: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.default,
    marginTop: 2,
  },
  rolePillText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.primary[700],
  },
  editProfileButton: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.primary[300],
    backgroundColor: theme.colors.surface.default,
  },
  editProfileButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.primary[700],
  },
  editForm: {
    gap: theme.spacing.sm,
  },
  editActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  editActionButton: {
    flex: 1,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error[700],
  },
  card: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.cardShadow,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    flexShrink: 0,
  },
  infoValueWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  infoValue: {
    flexShrink: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.primary,
    textAlign: "right",
  },
  verifiedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.success[50],
    flexShrink: 0,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.success[700],
  },
  statsRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: 4,
    borderRadius: theme.radii.md,
    gap: 4,
  },
  statValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
  },
  statLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  statSubtitle: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
    textAlign: "center",
  },
  expandHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  expandIconCircle: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  expandInfo: {
    flex: 1,
    gap: 1,
  },
  expandTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  expandSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  actionTile: {
    flexGrow: 1,
    minWidth: "45%",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: 4,
  },
  actionTileIconCircle: {
    width: 34,
    height: 34,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surface.default,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTileLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    textAlign: "center",
  },
  actionTileSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: "center",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  settingsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  settingsInfo: {
    flex: 1,
    gap: 1,
  },
  settingsLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },
  settingsSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
});
