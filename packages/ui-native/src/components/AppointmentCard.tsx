import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";
import type { AppointmentStatus } from "@doctor-connect/types";
import { StatusBadge } from "./Badge";

export interface AppointmentCardProps {
  doctorName: string;
  clinicName: string;
  dateLabel: string;
  timeLabel: string;
  tokenNumber: number | null;
  status: AppointmentStatus;
  onPress: () => void;
}

export function AppointmentCard({
  doctorName,
  clinicName,
  dateLabel,
  timeLabel,
  tokenNumber,
  status,
  onPress,
}: AppointmentCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.doctorName} numberOfLines={1}>
          {doctorName}
        </Text>
        <StatusBadge status={status} />
      </View>
      <Text style={styles.clinicName} numberOfLines={1}>
        {clinicName}
      </Text>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={theme.iconSizes.sm} color={theme.colors.text.tertiary} />
          <Text style={styles.metaText}>{dateLabel}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={theme.iconSizes.sm} color={theme.colors.text.tertiary} />
          <Text style={styles.metaText}>{timeLabel}</Text>
        </View>
        {tokenNumber != null ? (
          <View style={styles.metaItem}>
            <Ionicons name="ticket-outline" size={theme.iconSizes.sm} color={theme.colors.text.tertiary} />
            <Text style={styles.metaText}>Token #{tokenNumber}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    padding: theme.cardStyle.padding,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: theme.spacing.xxs,
    ...theme.cardShadow,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.xs,
  },
  doctorName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    flexShrink: 1,
  },
  clinicName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  metaRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xxs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
});
