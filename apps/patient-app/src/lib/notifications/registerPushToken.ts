import { Platform } from "react-native";
import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import * as Device from "expo-device";

// Push tokens only exist on a real device — simulators/Expo Go's own
// internal state have nothing to register with Expo's push service.
//
// Expo Go can no longer do remote push at all since SDK 53: calling
// getExpoPushTokenAsync there throws (not rejects) from inside
// expo-notifications' own internal guard, which was taking down the whole
// root layout. `isRunningInExpoGo()` is the exact same check that guard
// uses internally, so it's checked here first — and `expo-notifications`
// itself is only ever imported (not just called) once we know we're not
// in Expo Go, in case any of its other module-level code has side effects.
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;
  if (isRunningInExpoGo()) {
    if (__DEV__) {
      // eslint-disable-next-line no-console -- dev-only heads-up, not an error
      console.warn("Push notifications not available in Expo Go — use a development build to test.");
    }
    return null;
  }

  const Notifications = await import("expo-notifications");

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return null;

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  return token;
}
