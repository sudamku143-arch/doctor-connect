import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";

export type StatsCardTone = "purple" | "green" | "orange" | "blue";

export interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: StatsCardTone;
  /** Delta vs yesterday's same metric — renders "↑ N vs yesterday" (green),
   * "↓ N vs yesterday" (red), or "Same as yesterday" (neutral) for 0.
   * Omit when there's no prior-day figure to compare against. */
  trend?: number;
}

// Note: deliberately not naming a key "value" here — a plain object
// property named `.value` read inside a style array falsely triggers
// Reanimated's "are you using a shared value's .value in an inline
// style?" heuristic warning, even though nothing here is animated.
const TONE_COLORS: Record<StatsCardTone, { bg: string; fg: string; valueColor: string }> = {
  purple: { bg: theme.colors.primary[50], fg: theme.colors.primary[600], valueColor: theme.colors.primary[700] },
  green: { bg: theme.colors.success[50], fg: theme.colors.success[500], valueColor: theme.colors.success[700] },
  orange: { bg: theme.colors.warning[50], fg: theme.colors.warning[500], valueColor: theme.colors.warning[700] },
  blue: { bg: theme.colors.info[50], fg: theme.colors.info[500], valueColor: theme.colors.info[700] },
};

export function StatsCard({ label, value, icon, tone = "purple", trend }: StatsCardProps) {
  const colors = TONE_COLORS[tone];
  return (
    <View style={[styles.card, { backgroundColor: colors.bg }]}>
      {icon ? (
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.surface.default }]}>
          <Ionicons name={icon} size={18} color={colors.fg} />
        </View>
      ) : null}
      <Text style={[styles.value, { color: colors.valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend != null ? (
        trend === 0 ? (
          <Text style={styles.trendNeutral}>Same as yesterday</Text>
        ) : (
          <View style={styles.trendRow}>
            <Ionicons
              name={trend > 0 ? "arrow-up" : "arrow-down"}
              size={11}
              color={trend > 0 ? theme.colors.success[700] : theme.colors.error[700]}
            />
            <Text style={[styles.trendText, { color: trend > 0 ? theme.colors.success[700] : theme.colors.error[700] }]}>
              {Math.abs(trend)} vs yesterday
            </Text>
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    minWidth: "45%",
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: 6,
    ...theme.cardShadow,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  value: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold as any,
  },
  label: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold as any,
  },
  trendNeutral: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
});
