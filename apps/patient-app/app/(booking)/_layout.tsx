import { Stack } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { BookingDraftProvider } from "@/features/booking/BookingDraftContext";

export default function BookingLayout() {
  return (
    <BookingDraftProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.surface.default },
          headerTintColor: theme.colors.text.primary,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="consultation-type" options={{ headerShown: false }} />
        <Stack.Screen name="select-time" options={{ headerShown: false }} />
        <Stack.Screen name="patient-details" options={{ title: "Patient Details" }} />
        <Stack.Screen name="summary" options={{ headerShown: false }} />
        <Stack.Screen name="confirmed" options={{ title: "Booking Confirmed", headerShown: false }} />
      </Stack>
    </BookingDraftProvider>
  );
}
