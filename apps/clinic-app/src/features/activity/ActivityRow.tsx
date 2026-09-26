import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";
import type { ActivityLog } from "@doctor-connect/types";

export const ACTIVITY_ICON: Record<ActivityLog["type"], { icon: keyof typeof Ionicons.glyphMap; fg: string; bg: string }> = {
  CHECK_IN: { icon: "checkmark-circle", fg: theme.colors.success[500], bg: theme.colors.success[50] },
  CONSULTATION_COMPLETE: { icon: "checkmark-done-circle", fg: theme.colors.primary[600], bg: theme.colors.primary[50] },
  NEW_BOOKING: { icon: "calendar", fg: theme.colors.info[500], bg: theme.colors.info[50] },
  CANCELLED: { icon: "close-circle", fg: theme.colors.error[500], bg: theme.colors.error[50] },
  NO_SHOW: { icon: "alert-circle", fg: theme.colors.warning[500], bg: theme.colors.warning[50] },
};

export function ActivityRow({ entry, isLast }: { entry: ActivityLog; isLast: boolean }) {
  const meta = ACTIVITY_ICON[entry.type];
  const time = new Date(entry.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={16} color={meta.fg} />
      </View>
      <View style={styles.info}>
        <Text style={styles.message} numberOfLines={2}>
          {entry.message}
        </Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  message: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  time: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
});
