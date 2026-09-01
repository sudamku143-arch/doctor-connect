import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";
import { PrimaryButton, SecondaryButton } from "./Button";
import { VerifiedBadge } from "./Badge";

export interface DoctorCardProps {
  photoUrl?: string | null;
  name: string;
  verified: boolean;
  qualification: string;
  specialtyNames: string[];
  experienceYears: number;
  averageRating: number | null;
  reviewCount: number;
  clinicName: string;
  consultationFee: number;
  nextAvailableLabel?: string | null;
  onViewProfile: () => void;
  onBook: () => void;
}

export function DoctorCard({
  photoUrl,
  name,
  verified,
  qualification,
  specialtyNames,
  experienceYears,
  averageRating,
  reviewCount,
  clinicName,
  consultationFee,
  nextAvailableLabel,
  onViewProfile,
  onBook,
}: DoctorCardProps) {
  return (
    <Pressable onPress={onViewProfile} style={styles.card}>
      <View style={styles.topRow}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <Text style={styles.photoInitial}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {verified ? <VerifiedBadge /> : null}
          </View>
          <Text style={styles.qualification} numberOfLines={1}>
            {qualification}
          </Text>
          <Text style={styles.specialty} numberOfLines={1}>
            {specialtyNames.join(", ")} · {experienceYears}+ yrs exp.
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={theme.iconSizes.sm} color={theme.colors.warning[500]} />
          <Text style={styles.ratingText}>
            {averageRating != null ? averageRating.toFixed(1) : "New"}
            {reviewCount > 0 ? ` (${reviewCount})` : ""}
          </Text>
        </View>
        <Text style={styles.clinicName} numberOfLines={1}>
          {clinicName}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <View>
          <Text style={styles.fee}>₹{consultationFee}</Text>
          {nextAvailableLabel ? <Text style={styles.nextSlot}>Next: {nextAvailableLabel}</Text> : null}
        </View>
        <View style={styles.actions}>
          <SecondaryButton label="View Profile" onPress={onViewProfile} size="sm" fullWidth={false} />
          <PrimaryButton label="Book" onPress={onBook} size="sm" fullWidth={false} />
        </View>
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
    gap: theme.spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.md,
  },
  photoFallback: {
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  photoInitial: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.primary[600],
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  name: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    flexShrink: 1,
  },
  qualification: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  specialty: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.primary,
  },
  clinicName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
    flexShrink: 1,
    textAlign: "right",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    paddingTop: theme.spacing.sm,
  },
  fee: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  nextSlot: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success[700],
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
});
