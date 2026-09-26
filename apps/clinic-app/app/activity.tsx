import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { EmptyState, ErrorState, LoadingState } from "@doctor-connect/ui-native";
import type { ActivityLog } from "@doctor-connect/types";
import { useClinic } from "@/features/clinic/ClinicContext";
import { listRecentActivity } from "@/lib/api/activity";
import { setActivityLastSeen } from "@/lib/activityLastSeen";
import { ActivityRow } from "@/features/activity/ActivityRow";

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { staff } = useClinic();
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!staff) return;
    listRecentActivity(staff.clinic_id, 50)
      .then(setActivity)
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
    // Marks everything as read the moment the full feed is opened, even
    // before the list finishes loading — matches how the bell badge is
    // meant to behave (opening it clears it).
    setActivityLastSeen(staff.profile_id, new Date().toISOString());
  }, [staff]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.md, paddingBottom: insets.bottom + theme.spacing.xxxl }]}
    >
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Activity</Text>
      </View>

      {loading ? (
        <LoadingState title="Loading activity…" />
      ) : error ? (
        <ErrorState title={error} />
      ) : activity.length === 0 ? (
        <EmptyState icon="pulse-outline" title="No activity yet" description="Check-ins, bookings and cancellations will show up here." />
      ) : (
        <View style={styles.card}>
          {activity.map((entry, index) => (
            <ActivityRow key={entry.id} entry={entry} isLast={index === activity.length - 1} />
          ))}
        </View>
      )}
    </ScrollView>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  card: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.cardShadow,
  },
});
