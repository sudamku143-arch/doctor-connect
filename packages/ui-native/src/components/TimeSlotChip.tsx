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
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.surface.default,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  chipDisabled: {
    backgroundColor: theme.colors.neutral[100],
    borderColor: theme.colors.neutral[100],
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },
  labelSelected: {
    color: theme.colors.text.inverse,
  },
  labelDisabled: {
    color: theme.colors.text.disabled,
    textDecorationLine: "line-through",
  },
});
