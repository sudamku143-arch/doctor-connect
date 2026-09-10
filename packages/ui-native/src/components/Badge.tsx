import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";
import type { AppointmentStatus } from "@doctor-connect/types";

export type BadgeTone = "info" | "warning" | "success" | "danger" | "neutral";

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const { bg, fg } = toneColors(tone);
  return (
    <View style={[styles.base, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const STATUS_DISPLAY: Record<AppointmentStatus, { label: string; tone: BadgeTone }> = {
  PENDING_PAYMENT: { label: "Pending Payment", tone: "warning" },
  CONFIRMED: { label: "Confirmed", tone: "info" },
  RESCHEDULE_REQUESTED: { label: "Reschedule Requested", tone: "warning" },
  CHECKED_IN: { label: "Checked In", tone: "info" },
  WAITING: { label: "Waiting", tone: "info" },
  IN_CONSULTATION: { label: "In Consultation", tone: "success" },
  COMPLETED: { label: "Completed", tone: "success" },
  CANCELLED_BY_PATIENT: { label: "Cancelled", tone: "danger" },
  CANCELLED_BY_CLINIC: { label: "Cancelled by Clinic", tone: "danger" },
  NO_SHOW: { label: "No Show", tone: "danger" },
  REFUND_PENDING: { label: "Refund Pending", tone: "warning" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const display = STATUS_DISPLAY[status];
  return <Badge label={display.label} tone={display.tone} />;
}

export function VerifiedBadge() {
  return (
    <View style={styles.verifiedRow}>
      <Ionicons name="checkmark-circle" size={theme.iconSizes.sm} color={theme.colors.primary[500]} />
      <Text style={styles.verifiedLabel}>Verified</Text>
    </View>
  );
}

export function VideoAvailableBadge() {
  return (
    <View style={styles.videoAvailableRow}>
      <Ionicons name="videocam" size={theme.iconSizes.sm} color={theme.colors.success[700]} />
      <Text style={styles.videoAvailableLabel}>Video Consultation Available</Text>
    </View>
  );
}

function toneColors(tone: BadgeTone): { bg: string; fg: string } {
  switch (tone) {
    case "info":
      return { bg: theme.colors.info[50], fg: theme.colors.info[700] };
    case "warning":
      return { bg: theme.colors.warning[50], fg: theme.colors.warning[700] };
    case "success":
      return { bg: theme.colors.success[50], fg: theme.colors.success[700] };
    case "danger":
      return { bg: theme.colors.error[50], fg: theme.colors.error[700] };
    case "neutral":
    default:
      return { bg: theme.colors.neutral[100], fg: theme.colors.neutral[700] };
  }
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.badgeSizes.md.paddingHorizontal,
    paddingVertical: theme.badgeSizes.md.paddingVertical,
    borderRadius: theme.badgeSizes.md.radius,
  },
  label: {
    fontSize: theme.badgeSizes.md.fontSize,
    fontWeight: theme.fontWeight.semibold as any,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  verifiedLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.primary[600],
  },
  videoAvailableRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 4,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 3,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.success[50],
  },
  videoAvailableLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.success[700],
  },
});
