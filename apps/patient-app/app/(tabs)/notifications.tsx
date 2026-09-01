import { useCallback, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { EmptyState, ErrorState, LoadingState, NotificationListItem } from "@doctor-connect/ui-native";
import type { Notification } from "@doctor-connect/types";
import { listNotifications, markNotificationRead } from "@/lib/api/notifications";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listNotifications()
      .then(setNotifications)
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handlePress(notification: Notification) {
    if (!notification.read_at) {
      await markNotificationRead(notification.id).catch(() => undefined);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
    }
    const appointmentId = notification.data?.appointmentId;
    if (typeof appointmentId === "string") {
      router.push(`/appointment/${appointmentId}`);
    }
  }

  if (loading) return <LoadingState title="Loading notifications…" />;
  if (error) return <ErrorState title={error} onAction={load} actionLabel="Try again" />;
  if (notifications.length === 0) {
    return <EmptyState title="No notifications yet" description="Booking updates and reminders will show up here." />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {notifications.map((notification) => (
        <NotificationListItem
          key={notification.id}
          title={notification.title}
          body={notification.body}
          timeLabel={new Date(notification.created_at).toLocaleDateString()}
          isRead={notification.read_at != null}
          onPress={() => handlePress(notification)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
});
