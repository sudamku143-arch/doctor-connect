import { useRef, useState } from "react";
import { Dimensions, FlatList, StyleSheet, Text, View, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { PrimaryButton, SecondaryButton } from "@doctor-connect/ui-native";
import { markOnboardingSeen } from "@/lib/onboarding";

const { width } = Dimensions.get("window");

const SLIDES = [
  { title: "Find trusted doctors", description: "Search verified doctors and clinics near you in seconds." },
  { title: "Book appointments easily", description: "Pick a date, pick a time slot, and you're done." },
  { title: "Know your appointment and queue status", description: "See your live token and estimated wait time." },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  async function finish() {
    await markOnboardingSeen();
    router.replace("/(auth)/login");
  }

  function handleNext() {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      finish();
    }
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(nextIndex);
  }

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.skipRow}>
        <SecondaryButton label="Skip" onPress={finish} fullWidth={false} size="sm" />
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.illustration} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((slide, i) => (
          <View key={slide.title} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <PrimaryButton label={isLast ? "Get Started" : "Next"} onPress={handleNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  skipRow: {
    alignItems: "flex-end",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  illustration: {
    width: 180,
    height: 180,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.primary[50],
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
    textAlign: "center",
  },
  description: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.xxs,
    marginBottom: theme.spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.neutral[200],
  },
  dotActive: {
    backgroundColor: theme.colors.primary[500],
    width: 20,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
});
