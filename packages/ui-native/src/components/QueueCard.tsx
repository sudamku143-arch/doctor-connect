import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@doctor-connect/theme";

export interface QueueCardProps {
  tokenNumber: number;
  patientName?: string;
  label?: string;
  emphasis?: boolean;
  onPress?: () => void;
}

export function QueueCard({ tokenNumber, patientName, label, emphasis = false, onPress }: QueueCardProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={[styles.card, emphasis && styles.cardEmphasis]}>
      {label ? <Text style={[styles.label, emphasis && styles.labelEmphasis]}>{label}</Text> : null}
      <View style={styles.row}>
        <Text style={[styles.token, emphasis && styles.tokenEmphasis]}>#{tokenNumber}</Text>
        {patientName ? <Text style={[styles.name, emphasis && styles.nameEmphasis]}>{patientName}</Text> : null}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: 2,
  },
  cardEmphasis: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  label: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.tertiary,
    textTransform: "uppercase",
  },
  labelEmphasis: {
    color: theme.colors.primary[100],
  },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: theme.spacing.xs,
  },
  token: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  tokenEmphasis: {
    color: theme.colors.text.inverse,
  },
  name: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  nameEmphasis: {
    color: theme.colors.text.inverse,
  },
});
