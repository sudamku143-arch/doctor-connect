import AsyncStorage from "@react-native-async-storage/async-storage";

// Per-device "last seen" marker for the clinic Activity feed, keyed by
// profile so a shared device logging in as a different staff member
// doesn't inherit someone else's read state. Drives the dashboard's
// notification-bell badge without needing a separate per-user
// notifications fan-out on every check-in/booking/cancellation.
function storageKey(profileId: string): string {
  return `activity_last_seen:${profileId}`;
}

export async function getActivityLastSeen(profileId: string): Promise<string> {
  try {
    return (await AsyncStorage.getItem(storageKey(profileId))) ?? new Date(0).toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

export async function setActivityLastSeen(profileId: string, iso: string): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(profileId), iso);
  } catch {
    // Best-effort — worst case the badge count is stale next launch.
  }
}
