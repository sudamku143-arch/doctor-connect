import { SafeAreaView, StyleSheet } from "react-native";
import { theme } from "@doctor-connect/theme";
import { EmptyState } from "@doctor-connect/ui-native";

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <EmptyState
        title="Search coming soon"
        description="Search for doctors, specialties, and clinics once the directory is connected."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
});
