import { useEffect } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { upsertPushToken } from "@/lib/api/pushTokens";
import { registerForPushNotificationsAsync } from "@/lib/notifications/registerPushToken";

// Registration is best-effort: a denied permission, a simulator, or a
// missing EAS project id should never block using the app.
export function PushRegistration() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;
    registerForPushNotificationsAsync()
      .then((token) => (token ? upsertPushToken(token, userId) : undefined))
      .catch(() => {});
  }, [userId]);

  return null;
}
