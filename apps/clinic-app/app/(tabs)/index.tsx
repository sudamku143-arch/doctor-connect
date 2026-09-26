import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { EmptyState, ErrorState, LoadingState, StatsCard } from "@doctor-connect/ui-native";
import type { ActivityLog, AppointmentStatus } from "@doctor-connect/types";
import { useClinic } from "@/features/clinic/ClinicContext";
import { DoctorIllustration } from "@/features/auth/DoctorIllustration";
import { ActivityRow } from "@/features/activity/ActivityRow";
import { countActivitySince, listRecentActivity } from "@/lib/api/activity";
import { listClinicAppointments } from "@/lib/api/appointments";
import type { ClinicAppointment } from "@/lib/api/types";
import { getActivityLastSeen } from "@/lib/activityLastSeen";
import { addDays, formatFullDateLabel, formatTimeLabel, getGreeting, todayDateString } from "@/lib/format";

const CHECKED_IN_STATUSES = ["CHECKED_IN", "WAITING", "IN_CONSULTATION", "COMPLETED"];

const QUICK_ACTIONS: {
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: "/(tabs)/queue" | "/(tabs)/appointments" | "/(tabs)/schedule" | "/patients" | "/new-appointment" | "/support";
}[] = [
  { label: "Today's Queue", subtitle: "See who's waiting", icon: "hourglass-outline", route: "/(tabs)/queue" },
  { label: "Appointments", subtitle: "View all bookings", icon: "calendar-outline", route: "/(tabs)/appointments" },
  { label: "Doctor Schedule", subtitle: "Manage availability", icon: "medkit-outline", route: "/(tabs)/schedule" },
  { label: "Patients", subtitle: "Search patient records", icon: "people-outline", route: "/patients" },
  { label: "New Appointment", subtitle: "Book a walk-in patient", icon: "add-circle-outline", route: "/new-appointment" },
  { label: "Support", subtitle: "Get help & FAQs", icon: "help-buoy-outline", route: "/support" },
];

// Local to the dashboard's list row — deliberately not folded into the
// shared StatusBadge (used across both apps for every appointment status
// display), since this exact palette ("Waiting" = orange, "Confirmed"
// read as "Upcoming") is specific to this one screen's reference design.
const ROW_STATUS: Partial<Record<AppointmentStatus, { label: string; bg: string; fg: string }>> = {
  CONFIRMED: { label: "Upcoming", bg: theme.colors.primary[50], fg: theme.colors.primary[700] },
  CHECKED_IN: { label: "Checked In", bg: theme.colors.info[50], fg: theme.colors.info[700] },
  WAITING: { label: "Waiting", bg: theme.colors.warning[50], fg: theme.colors.warning[700] },
  IN_CONSULTATION: { label: "In Consultation", bg: theme.colors.success[50], fg: theme.colors.success[700] },
  COMPLETED: { label: "Completed", bg: theme.colors.neutral[100], fg: theme.colors.neutral[600] },
};

export default function ClinicDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { staff, isLoading: clinicLoading, error: clinicError } = useClinic();
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);
  const [yesterdayAppointments, setYesterdayAppointments] = useState<ClinicAppointment[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [unreadActivity, setUnreadActivity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!staff) return;
      const yesterdayStr = addDays(todayDateString(), -1);
      getActivityLastSeen(staff.profile_id).then((lastSeen) => {
        countActivitySince(staff.clinic_id, lastSeen)
          .then(setUnreadActivity)
          .catch(() => undefined);
      });
      Promise.all([
        listClinicAppointments(staff.clinic_id, "today"),
        listClinicAppointments(staff.clinic_id, "today", { date: yesterdayStr }),
        listRecentActivity(staff.clinic_id),
      ])
        .then(([todayRows, yesterdayRows, activityRows]) => {
          setAppointments(todayRows);
          setYesterdayAppointments(yesterdayRows);
          setActivity(activityRows);
        })
        .catch(() => setError("Something went wrong. Please try again."))
        .finally(() => setLoading(false));
    }, [staff]),
  );

  if (clinicLoading) return <LoadingState title="Loading…" />;
  if (clinicError || !staff) return <ErrorState title={clinicError ?? "Something went wrong."} />;

  const checkedInCount = appointments.filter((a) => CHECKED_IN_STATUSES.includes(a.status)).length;
  const waitingCount = appointments.filter((a) => a.status === "WAITING").length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;

  const yesterdayCheckedInCount = yesterdayAppointments.filter((a) => CHECKED_IN_STATUSES.includes(a.status)).length;
  const yesterdayWaitingCount = yesterdayAppointments.filter((a) => a.status === "WAITING").length;
  const yesterdayCompletedCount = yesterdayAppointments.filter((a) => a.status === "COMPLETED").length;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[...theme.heroGradient]}
        style={[styles.headerGradient, { paddingTop: insets.top + theme.spacing.md }]}
      >
        <View style={styles.illustrationWrap} pointerEvents="none">
          <DoctorIllustration width={200} height={170} />
        </View>

        <View style={styles.brandRow}>
          <View style={styles.brandLeft}>
            <View style={styles.logoBadge}>
              <Ionicons name="medical" size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brandName}>Doctor Connect</Text>
              <Text style={styles.brandTagline}>Clinic Portal</Text>
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
            <Pressable style={styles.headerIconButton} onPress={() => router.push("/clinic-profile")} hitSlop={6}>
              <Ionicons name="business-outline" size={19} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>
            {getGreeting()}, Receptionist <Text>👋</Text>
          </Text>
          <Text style={styles.clinicName}>{staff.clinic.name}</Text>
        </View>

        <View style={styles.datePill}>
          <Ionicons name="calendar-outline" size={12} color={theme.colors.primary[700]} />
          <Text style={styles.datePillText}>{formatFullDateLabel(todayDateString())}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <StatsCard
            label="Today's Appointments"
            value={appointments.length}
            icon="calendar"
            tone="purple"
            trend={appointments.length - yesterdayAppointments.length}
          />
          <StatsCard
            label="Checked In"
            value={checkedInCount}
            icon="checkmark-circle"
            tone="blue"
            trend={checkedInCount - yesterdayCheckedInCount}
          />
          <StatsCard
            label="Waiting"
            value={waitingCount}
            icon="time"
            tone="orange"
            trend={waitingCount - yesterdayWaitingCount}
          />
          <StatsCard
            label="Completed"
            value={completedCount}
            icon="checkmark-done-circle"
            tone="green"
            trend={completedCount - yesterdayCompletedCount}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable key={action.label} style={styles.actionCard} onPress={() => router.push(action.route)}>
                <View style={styles.actionIconCircle}>
                  <Ionicons name={action.icon} size={20} color={theme.colors.primary[600]} />
                </View>
                <Text style={styles.actionCardLabel}>{action.label}</Text>
                <Text style={styles.actionCardSubtitle} numberOfLines={1}>
                  {action.subtitle}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Today&apos;s appointments</Text>
            {appointments.length > 0 ? (
              <Text style={styles.viewAllLink} onPress={() => router.push("/(tabs)/appointments")}>
                View All →
              </Text>
            ) : null}
          </View>
          {loading ? (
            <LoadingState title="Loading appointments…" />
          ) : error ? (
            <ErrorState title={error} />
          ) : appointments.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No appointments today"
              description="New bookings will show up here as patients check in."
            />
          ) : (
            <View style={styles.apptListCard}>
              {appointments.slice(0, 6).map((appointment, index) => (
                <TodayAppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  isLast={index === Math.min(appointments.length, 6) - 1}
                  onPress={() => router.push(`/appointment/${appointment.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        {activity.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Text style={styles.viewAllLink} onPress={() => router.push("/activity")}>
                View All →
              </Text>
            </View>
            <View style={styles.apptListCard}>
              {activity.map((entry, index) => (
                <ActivityRow key={entry.id} entry={entry} isLast={index === activity.length - 1} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <Text style={styles.tipText}>Tip: Check the patient queue regularly to keep consultations running smoothly.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function TodayAppointmentRow({
  appointment,
  isLast,
  onPress,
}: {
  appointment: ClinicAppointment;
  isLast: boolean;
  onPress: () => void;
}) {
  const status = ROW_STATUS[appointment.status] ?? ROW_STATUS.CONFIRMED!;
  return (
    <Pressable onPress={onPress} style={[styles.apptRow, !isLast && styles.apptRowDivider]}>
      <View style={styles.apptTimeBadge}>
        <Text style={styles.apptTimeText}>{formatTimeLabel(appointment.appointment_time)}</Text>
      </View>
      <View style={styles.apptAvatar}>
        <Ionicons name="person" size={16} color={theme.colors.primary[500]} />
      </View>
      <View style={styles.apptInfo}>
        <Text style={styles.apptPatientName} numberOfLines={1}>
          {appointment.patientProfile?.full_name ?? "Patient"}
        </Text>
        <Text style={styles.apptDoctorName} numberOfLines={1}>
          {appointment.doctor.full_name}
        </Text>
      </View>
      <View style={[styles.apptStatusPill, { backgroundColor: status.bg }]}>
        <Text style={[styles.apptStatusText, { color: status.fg }]} numberOfLines={1}>
          {status.label}
        </Text>
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
    gap: theme.spacing.md,
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
  greetingBlock: {
    gap: 2,
  },
  datePill: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5,
    borderRadius: theme.radii.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  datePillText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.primary[700],
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.xl,
  },
  greeting: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: "#FFFFFF",
  },
  clinicName: {
    fontSize: theme.fontSize.sm,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewAllLink: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.primary[600],
  },
  apptListCard: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.cardShadow,
  },
  apptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  apptRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  apptTimeBadge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 5,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary[50],
    flexShrink: 0,
  },
  apptTimeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.primary[700],
  },
  apptAvatar: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  apptInfo: {
    flex: 1,
    gap: 1,
  },
  apptPatientName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  apptDoctorName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  apptStatusPill: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
    flexShrink: 0,
    maxWidth: 92,
  },
  apptStatusText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.semibold as any,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  actionCard: {
    flexGrow: 1,
    minWidth: "45%",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: theme.spacing.xs,
    ...theme.cardShadow,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  actionCardLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.primary[700],
    textAlign: "center",
  },
  actionCardSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: "center",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primary[50],
  },
  tipEmoji: {
    fontSize: theme.fontSize.md,
  },
  tipText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[700],
    lineHeight: theme.fontSize.sm * 1.5,
  },
});
