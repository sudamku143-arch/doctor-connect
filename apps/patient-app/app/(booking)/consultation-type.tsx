import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { ErrorState, LoadingState } from "@doctor-connect/ui-native";
import type { ConsultationType } from "@doctor-connect/types";
import { getDoctorProfile } from "@/lib/api/doctors";
import { useBookingDraft } from "@/features/booking/BookingDraftContext";

interface ConsultationOption {
  type: ConsultationType;
  title: string;
  description: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const VIDEO_OPTION: ConsultationOption = {
  type: "VIDEO",
  title: "Video Consultation",
  description: "Consult from home via video call",
  badge: "From Home",
  icon: "videocam",
};

const PHYSICAL_OPTION: ConsultationOption = {
  type: "PHYSICAL",
  title: "Physical Consultation",
  description: "Visit the clinic in person",
  badge: "In-Clinic",
  icon: "business",
};

export default function ConsultationTypeScreen() {
  const insets = useSafeAreaInsets();
  const { doctorClinicId } = useLocalSearchParams<{ doctorClinicId: string }>();
  const { draft, setDoctorContext, setConsultationType } = useBookingDraft();

  const [loading, setLoading] = useState(!draft.doctor);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ConsultationType | null>(draft.consultationType ?? null);

  useEffect(() => {
    if (draft.doctor || !doctorClinicId) return;
    let cancelled = false;
    getDoctorProfile(doctorClinicId)
      .then((item) => {
        if (cancelled) return;
        if (!item) {
          setError("Doctor not found.");
          return;
        }
        setDoctorContext({
          doctorClinicId: item.doctorClinicId,
          doctor: item.doctor,
          clinic: item.clinic,
          consultationFee: item.consultationFee,
          averageRating: item.averageRating,
          reviewCount: item.reviewCount,
        });
      })
      .catch(() => !cancelled && setError("Something went wrong. Please try again."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [doctorClinicId, draft.doctor, setDoctorContext]);

  if (loading) {
    return <LoadingState title="Loading options…" />;
  }
  if (error || !draft.doctor) {
    return <ErrorState title={error ?? "Something went wrong. Please try again."} />;
  }

  const fee = draft.consultationFee ?? 0;
  const videoAllowed = draft.doctor.consultation_mode !== "PHYSICAL_ONLY";
  const options = videoAllowed ? [VIDEO_OPTION, PHYSICAL_OPTION] : [PHYSICAL_OPTION];

  if (!videoAllowed && selected === null) {
    setSelected("PHYSICAL");
  }

  function handleContinue() {
    if (!selected) return;
    setConsultationType(selected);
    router.push({
      pathname: "/(booking)/select-time",
      params: { doctorClinicId: draft.doctorClinicId ?? doctorClinicId },
    });
  }

  return (
    <>
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.primary[700]]}
        style={[styles.headerGradient, { paddingTop: insets.top + theme.spacing.md }]}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.iconButton} onPress={() => router.back()} hitSlop={6}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.primary[700]} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={2}>
            Select Consultation Type
          </Text>
          <View style={styles.iconButton} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>How would you like to consult {draft.doctor.full_name}?</Text>

        <View style={styles.cardStack}>
          {options.map((option) => {
            const isSelected = selected === option.type;
            return (
              <Pressable
                key={option.type}
                onPress={() => setSelected(option.type)}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              >
                <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
                  <Ionicons
                    name={option.icon}
                    size={26}
                    color={isSelected ? theme.colors.text.inverse : theme.colors.primary[600]}
                  />
                </View>

                <View style={styles.optionBody}>
                  <View style={styles.optionTopRow}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{option.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                  <Text style={styles.optionFee}>₹{fee}</Text>
                </View>

                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected ? <View style={styles.radioInner} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {!videoAllowed ? (
          <Text style={styles.noticeText}>This doctor only accepts in-clinic visits.</Text>
        ) : (
          <Text style={styles.noticeText}>Same consultation fee either way — no extra charge for video.</Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing.md }]}>
        <Pressable disabled={!selected} onPress={handleContinue}>
          <LinearGradient
            colors={selected ? [theme.colors.primary[500], theme.colors.primary[700]] : [theme.colors.neutral[200], theme.colors.neutral[200]]}
            style={styles.confirmButton}
          >
            <Text style={[styles.confirmButtonText, !selected && styles.confirmButtonTextDisabled]}>Continue</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: "#FFFFFF",
    textAlign: "center",
  },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  cardStack: {
    gap: theme.spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.cardStyle.radius,
    padding: theme.cardStyle.padding,
    borderWidth: 1.5,
    borderColor: theme.colors.border.default,
  },
  optionCardSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  iconCircle: {
    width: 52,
    height: 52,
    flexShrink: 0,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleSelected: {
    backgroundColor: theme.colors.primary[500],
  },
  optionBody: {
    flex: 1,
    gap: 3,
  },
  optionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  optionTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  badge: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.success[50],
  },
  badgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.success[700],
  },
  optionDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  optionFee: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    flexShrink: 0,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.border.strong,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: theme.colors.primary[500],
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary[500],
  },
  noticeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: "center",
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface.default,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  confirmButton: {
    height: 52,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold as any,
    color: "#FFFFFF",
  },
  confirmButtonTextDisabled: {
    color: theme.colors.text.disabled,
  },
});
