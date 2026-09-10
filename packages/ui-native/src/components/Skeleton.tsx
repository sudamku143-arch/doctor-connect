import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, type DimensionValue } from "react-native";
import { theme } from "@doctor-connect/theme";

export interface SkeletonBlockProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: object;
}

// A single pulsing placeholder rectangle — the building block every
// skeleton layout below is made of.
export function SkeletonBlock({ width = "100%", height = 14, radius = 6, style }: SkeletonBlockProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, easing: Easing.ease, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: theme.colors.border.default, opacity },
        style,
      ]}
    />
  );
}

export function DoctorCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <SkeletonBlock width={56} height={56} radius={theme.radii.md} />
        <View style={styles.identity}>
          <SkeletonBlock width="70%" height={16} />
          <SkeletonBlock width="50%" height={12} />
          <SkeletonBlock width="85%" height={12} />
        </View>
      </View>
      <View style={styles.metaRow}>
        <SkeletonBlock width={60} height={12} />
        <SkeletonBlock width={100} height={12} />
      </View>
      <View style={styles.footerRow}>
        <SkeletonBlock width={70} height={18} />
        <SkeletonBlock width={140} height={32} radius={theme.radii.md} />
      </View>
    </View>
  );
}

export function AppointmentCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <SkeletonBlock width="55%" height={16} />
        <SkeletonBlock width={70} height={20} radius={theme.radii.pill} />
      </View>
      <SkeletonBlock width="40%" height={12} />
      <View style={styles.metaRow}>
        <SkeletonBlock width={70} height={12} />
        <SkeletonBlock width={70} height={12} />
        <SkeletonBlock width={70} height={12} />
      </View>
    </View>
  );
}

export function ListSkeleton({ item: Item, count = 3 }: { item: React.ComponentType; count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <Item key={i} />
      ))}
    </View>
  );
}

export function DetailSkeleton() {
  return (
    <View style={styles.list}>
      <View style={styles.topRow}>
        <SkeletonBlock width={64} height={64} radius={theme.radii.pill} />
        <View style={styles.identity}>
          <SkeletonBlock width="60%" height={18} />
          <SkeletonBlock width="40%" height={12} />
          <SkeletonBlock width="50%" height={12} />
        </View>
      </View>
      <SkeletonBlock width="100%" height={80} radius={theme.radii.lg} />
      <SkeletonBlock width="100%" height={100} radius={theme.radii.lg} />
      <SkeletonBlock width="100%" height={48} radius={theme.radii.md} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.md,
  },
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
    alignItems: "center",
  },
  identity: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    paddingTop: theme.spacing.sm,
  },
});
