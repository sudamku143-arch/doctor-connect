import { SafeAreaView, StyleSheet } from "react-native";
import { theme } from "@doctor-connect/theme";
import { EmptyState } from "@doctor-connect/ui-native";

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <EmptyState title="No notifications yet" description="Booking updates and reminders will show up here." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
});
