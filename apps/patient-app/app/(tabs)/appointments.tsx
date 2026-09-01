import { SafeAreaView, StyleSheet } from "react-native";
import { theme } from "@doctor-connect/theme";
import { EmptyState } from "@doctor-connect/ui-native";

export default function AppointmentsScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <EmptyState title="No appointments yet" description="Book your first appointment to see it here." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
});
