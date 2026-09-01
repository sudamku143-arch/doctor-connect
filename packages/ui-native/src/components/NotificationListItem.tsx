import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";

export interface NotificationListItemProps {
  title: string;
  body: string;
  timeLabel: string;
  isRead: boolean;
  onPress: () => void;
}

export function NotificationListItem({ title, body, timeLabel, isRead, onPress }: NotificationListItemProps) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.dot, isRead && styles.dotRead]} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, !isRead && styles.titleUnread]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.time}>{timeLabel}</Text>
        </View>
        <Text style={styles.body} numberOfLines={2}>
          {body}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={theme.iconSizes.sm} color={theme.colors.text.tertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.default,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[500],
    marginTop: 6,
  },
  dotRead: {
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.primary,
    flexShrink: 1,
  },
  titleUnread: {
    fontWeight: theme.fontWeight.bold as any,
  },
  time: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  body: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});
