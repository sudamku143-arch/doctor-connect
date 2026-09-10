import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { theme } from "@doctor-connect/theme";

export interface TimeSlotChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export function TimeSlotChip({ label, selected = false, disabled = false, onPress }: TimeSlotChipProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        disabled && styles.chipDisabled,
      ]}
    >
      <Text
        style={[
          styles.label,
          selected && styles.labelSelected,
          disabled && styles.labelDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    backgroundColor: theme.colors.primary[50],
  },
  chipSelected: {
    backgroundColor: theme.colors.primary[600],
  },
  chipDisabled: {
    backgroundColor: theme.colors.neutral[100],
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.primary[700],
  },
  labelSelected: {
    color: theme.colors.text.inverse,
  },
  labelDisabled: {
    color: theme.colors.text.disabled,
    textDecorationLine: "line-through",
  },
});
