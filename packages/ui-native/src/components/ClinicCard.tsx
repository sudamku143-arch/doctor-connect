import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";

export interface ClinicCardProps {
  name: string;
  address: string;
  statusLabel: string | null;
  specialtyNames: string[];
  photoUrl?: string | null;
  onPress?: () => void;
}

export function ClinicCard({ name, address, statusLabel, specialtyNames, photoUrl, onPress }: ClinicCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress} disabled={!onPress}>
      <View style={styles.topRow}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.icon} />
        ) : (
          <View style={styles.icon}>
            <Ionicons name="business" size={22} color={theme.colors.primary[600]} />
          </View>
        )}
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {address}
            {statusLabel ? ` • ${statusLabel}` : ""}
          </Text>
        </View>
      </View>
      {specialtyNames.length > 0 ? (
        <View style={styles.chipRow}>
          {specialtyNames.map((specialty) => (
            <View key={specialty} style={styles.chip}>
              <Text style={styles.chipLabel} numberOfLines={1}>
                {specialty}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
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
    gap: theme.spacing.sm,
    ...theme.cardShadow,
  },
  topRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  identity: {
    flex: 1,
    gap: 2,
    justifyContent: "center",
  },
  name: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  meta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xxs,
  },
  chip: {
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 3,
    borderRadius: theme.radii.pill,
  },
  chipLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.primary[700],
  },
});
