import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";
import { PrimaryButton } from "./Button";
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
  onClinicPress?: () => void;
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
  onClinicPress,
  onBook,
}: DoctorCardProps) {
  return (
    <Pressable onPress={onViewProfile} style={styles.card}>
      <View style={styles.topRow}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <FontAwesome5 name="user-md" size={26} color={theme.colors.primary[500]} />
          </View>
        )}
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <View style={styles.nameLeft}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              {verified ? <VerifiedBadge /> : null}
            </View>
            {reviewCount === 0 ? (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeLabel}>New</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.qualification} numberOfLines={1}>
            {qualification}
          </Text>
          <Text style={styles.specialty} numberOfLines={1}>
            {specialtyNames.join(", ")}
          </Text>
          <View style={styles.ratingRow}>
            {reviewCount > 0 ? (
              <>
                <Ionicons name="star" size={theme.iconSizes.sm} color={theme.colors.warning[500]} />
                <Text style={styles.ratingText}>
                  {averageRating != null ? averageRating.toFixed(1) : "New"} | {reviewCount} Reviews
                </Text>
                <Text style={styles.ratingDot}>•</Text>
              </>
            ) : null}
            <Text style={styles.ratingText}>{experienceYears}+ yrs exp</Text>
          </View>
        </View>
      </View>

      <Text
        style={styles.clinicName}
        numberOfLines={1}
        onPress={onClinicPress}
        suppressHighlighting={!onClinicPress}
      >
        {clinicName}
      </Text>

      <View style={styles.footerRow}>
        <Text style={styles.fee}>₹{consultationFee}</Text>
        {nextAvailableLabel ? (
          <View style={styles.nextSlotRow}>
            <View style={styles.nextDot} />
            <Text style={styles.nextSlot} numberOfLines={1}>
              Next: {nextAvailableLabel}
            </Text>
          </View>
        ) : (
          <View style={styles.nextSlotRow} />
        )}
        <PrimaryButton label="Book Appointment" onPress={onBook} size="sm" fullWidth={false} />
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
    ...theme.cardShadow,
  },
  topRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  photoFallback: {
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  newBadge: {
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.xxs,
    paddingVertical: 1,
    borderRadius: theme.radii.sm,
    flexShrink: 0,
  },
  newBadgeLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.primary[600],
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.xxs,
  },
  nameLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
    flexShrink: 1,
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
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  ratingText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.secondary,
  },
  ratingDot: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  clinicName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.primary[600],
    textDecorationLine: "underline",
    marginTop: -theme.spacing.xxs,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    paddingTop: theme.spacing.sm,
  },
  fee: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
    flexShrink: 0,
  },
  nextSlotRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nextDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success[500],
    flexShrink: 0,
  },
  nextSlot: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success[700],
    flexShrink: 1,
  },
});
