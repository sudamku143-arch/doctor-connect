import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { theme } from "@doctor-connect/theme";

export interface DateStripItem {
  /** ISO date string, e.g. 2026-09-02 */
  date: string;
  label: string;
  dayOfWeek: string;
  dayNumber: string;
  disabled?: boolean;
}

export interface DateStripProps {
  items: DateStripItem[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

export function DateStrip({ items, selectedDate, onSelect }: DateStripProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => {
        const isSelected = item.date === selectedDate;
        return (
          <Pressable
            key={item.date}
            disabled={item.disabled}
            onPress={() => onSelect(item.date)}
            style={[styles.item, isSelected && styles.itemSelected, item.disabled && styles.itemDisabled]}
          >
            <Text style={[styles.dayOfWeek, isSelected && styles.textSelected]}>{item.dayOfWeek}</Text>
            <Text style={[styles.dayNumber, isSelected && styles.textSelected]}>{item.dayNumber}</Text>
            {item.label ? (
              <Text style={[styles.label, isSelected && styles.textSelected]}>{item.label}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: theme.spacing.xs,
  },
  item: {
    width: 60,
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.surface.default,
    gap: 2,
  },
  itemSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  itemDisabled: {
    opacity: 0.4,
  },
  dayOfWeek: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  dayNumber: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  label: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
  textSelected: {
    color: theme.colors.text.inverse,
  },
});
