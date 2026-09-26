import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { registerClinicSchema } from "@doctor-connect/validation";
import { TextField } from "@doctor-connect/ui-native";
import { supabase } from "@/lib/supabase/client";
import { registerClinic } from "@/lib/api/register";

const SCRIM_TOP = "#6E56A6";
const SCRIM_BOTTOM = "#8570C2";
const ACCENT = "#8B5CFF";
const ACCENT_STRONG = "#A480FF";
const ACCENT_LIGHT = "#C4A8FF";

// Odisha cities first (this platform's home market), then the other major
// metros — a real, useful list rather than a Berhampur-only stub, since a
// brand-new clinic registering here is by definition not yet one of the
// cities any existing clinic already reports.
const CITY_OPTIONS = [
  "Berhampur",
  "Bhubaneswar",
  "Cuttack",
  "Rourkela",
  "Sambalpur",
  "Puri",
  "Balasore",
  "Baripada",
  "Bhadrak",
  "Angul",
  "Jharsuguda",
  "Koraput",
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Surat",
  "Nagpur",
  "Indore",
  "Patna",
  "Bhopal",
  "Vadodara",
  "Chandigarh",
  "Visakhapatnam",
  "Coimbatore",
  "Guwahati",
  "Kochi",
];

interface FieldConfig {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  helper: string;
}

const FIELD_META = {
  clinicName: { icon: "briefcase-outline", label: "Clinic name", helper: "Enter your clinic or hospital name" },
  fullName: { icon: "person-outline", label: "Your name", helper: "Enter your full name" },
  email: { icon: "mail-outline", label: "Email", helper: "We'll use this for communication" },
  phone: { icon: "call-outline", label: "Phone number", helper: "Enter your mobile number" },
  password: { icon: "lock-closed-outline", label: "Password", helper: "Create a secure password" },
  address: { icon: "location-outline", label: "Clinic address", helper: "Tap the pin to use your current location, or type it in" },
  city: { icon: "business-outline", label: "City", helper: "Select your city" },
} as const satisfies Record<string, FieldConfig>;

export default function RegisterClinicScreen() {
  const insets = useSafeAreaInsets();
  const [clinicName, setClinicName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [city, setCity] = useState("");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [locating, setLocating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUseCurrentLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location permission needed", "Please allow location access to auto-fill your clinic address.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });

      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      if (place) {
        const addressParts = [place.streetNumber, place.street, place.district, place.city, place.region, place.postalCode].filter(
          (part): part is string => Boolean(part),
        );
        if (addressParts.length > 0) setAddress(addressParts.join(", "));
        // Only auto-pick the city if the user hasn't already chosen one
        // themselves — the pin fills in a starting point, not a decision.
        if (place.city && !city && CITY_OPTIONS.includes(place.city)) setCity(place.city);
      }
    } catch {
      Alert.alert("Could not get location", "Please enter your clinic address manually.");
    } finally {
      setLocating(false);
    }
  }

  async function handleRegister() {
    setFormError(null);
    const result = registerClinicSchema.safeParse({ clinicName, fullName, email, phone, password, address, city });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[issue.path[0] as string] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: { data: { full_name: result.data.fullName, phone: result.data.phone } },
      });
      if (signUpError) {
        setFormError(signUpError.message);
        return;
      }
      if (!signUpData.session) {
        // Email confirmation is required on this project — the account
        // exists but isn't signed in yet, so register_clinic (which reads
        // auth.uid()) can't run until they confirm and log in.
        setFormError("Account created. Please check your email to confirm it, then log in to finish setting up your clinic.");
        return;
      }

      await registerClinic({
        clinicName: result.data.clinicName,
        address: result.data.address,
        city: result.data.city,
        phone: result.data.phone,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      router.replace("/(tabs)");
    } catch {
      setFormError("Could not register your clinic. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={[SCRIM_TOP, SCRIM_BOTTOM]} style={[styles.headerGradient, { paddingTop: insets.top + theme.spacing.lg }]}>
        <View style={styles.decorCircleLarge} pointerEvents="none" />
        <View style={styles.decorCircleSmall} pointerEvents="none" />

        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Ionicons name="medical" size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brandName}>Doctor Connect</Text>
              <Text style={styles.brandTagline}>Better Care • Healthier Tomorrow</Text>
            </View>
          </View>

          <View style={styles.buildingIconWrap}>
            <Ionicons name="business" size={34} color="#FFFFFF" />
            <View style={styles.buildingBadge}>
              <Ionicons name="medical" size={12} color={ACCENT} />
            </View>
          </View>
        </View>

        <View style={styles.headingBlock}>
          <Text style={styles.title}>Register Your Clinic</Text>
          <Text style={styles.subtitle}>Set up your clinic and start managing your appointments easily.</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + theme.spacing.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Field meta={FIELD_META.clinicName}>
              <TextField
                leftIcon={FIELD_META.clinicName.icon}
                placeholder="e.g. City Care Clinic"
                value={clinicName}
                onChangeText={setClinicName}
                error={fieldErrors.clinicName}
              />
            </Field>

            <Field meta={FIELD_META.fullName}>
              <TextField
                leftIcon={FIELD_META.fullName.icon}
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChangeText={setFullName}
                error={fieldErrors.fullName}
              />
            </Field>

            <Field meta={FIELD_META.email}>
              <TextField
                leftIcon={FIELD_META.email.icon}
                placeholder="you@clinic.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                error={fieldErrors.email}
              />
            </Field>

            <Field meta={FIELD_META.phone}>
              <TextField
                leftIcon={FIELD_META.phone.icon}
                placeholder="9876543210"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                error={fieldErrors.phone}
              />
            </Field>

            <Field meta={FIELD_META.password}>
              <TextField
                leftIcon={FIELD_META.password.icon}
                placeholder="Min. 8 characters"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                error={fieldErrors.password}
              />
            </Field>

            <Field meta={FIELD_META.address}>
              <TextField
                leftIcon={FIELD_META.address.icon}
                onLeftIconPress={handleUseCurrentLocation}
                leftIconBusy={locating}
                placeholder="Flat, Building, Area, City, State"
                value={address}
                onChangeText={setAddress}
                error={fieldErrors.address}
              />
            </Field>

            <Field meta={FIELD_META.city}>
              <Pressable
                style={[styles.selectBox, fieldErrors.city && styles.selectBoxError]}
                onPress={() => setShowCityPicker(true)}
              >
                <Ionicons name={FIELD_META.city.icon} size={theme.iconSizes.sm} color={theme.colors.text.tertiary} />
                <Text style={[styles.selectText, !city && styles.selectPlaceholder]}>{city || "Select city"}</Text>
                <Ionicons name="chevron-down" size={16} color={theme.colors.text.tertiary} />
              </Pressable>
              {fieldErrors.city ? <Text style={styles.selectError}>{fieldErrors.city}</Text> : null}
            </Field>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <Pressable
              onPress={handleRegister}
              disabled={loading}
              style={({ pressed }) => [styles.submitButtonWrap, pressed && styles.submitButtonPressed]}
            >
              <LinearGradient
                colors={[ACCENT_LIGHT, ACCENT_STRONG, ACCENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.submitButtonContent}>
                    <Text style={styles.submitButtonText}>Register Clinic</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.footerLine} />
            <View style={styles.footerTextRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable
                onPress={() => router.replace("/login")}
                hitSlop={8}
                style={({ pressed }) => [styles.footerLinkPill, pressed && styles.footerLinkPillPressed]}
              >
                <Text style={styles.footerLink}>Login</Text>
              </Pressable>
            </View>
            <View style={styles.footerLine} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showCityPicker} transparent animationType="fade" onRequestClose={() => setShowCityPicker(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCityPicker(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select your city</Text>
            <ScrollView style={styles.modalList}>
              {CITY_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={styles.cityOption}
                  onPress={() => {
                    setCity(option);
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={styles.cityOptionLabel}>{option}</Text>
                  {option === city ? <Ionicons name="checkmark" size={18} color={theme.colors.primary[600]} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Field({ meta, children }: { meta: FieldConfig; children: React.ReactNode }) {
  return (
    <View style={styles.fieldBlock}>
      <View style={styles.fieldHeaderRow}>
        <View style={styles.fieldIconCircle}>
          <Ionicons name={meta.icon} size={16} color={theme.colors.primary[600]} />
        </View>
        <View style={styles.fieldHeaderText}>
          <Text style={styles.fieldLabel}>{meta.label}</Text>
          <Text style={styles.fieldHelper}>{meta.helper}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  headerGradient: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    gap: theme.spacing.lg,
  },
  decorCircleLarge: {
    position: "absolute",
    top: -60,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  decorCircleSmall: {
    position: "absolute",
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    flexShrink: 1,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold as any,
    color: "#FFFFFF",
  },
  brandTagline: {
    fontSize: theme.fontSize.xs,
    color: "rgba(255,255,255,0.75)",
  },
  buildingIconWrap: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  buildingBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: theme.radii.pill,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: SCRIM_TOP,
  },
  headingBlock: {
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold as any,
    letterSpacing: -0.3,
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: "rgba(255,255,255,0.85)",
    lineHeight: theme.fontSize.base * 1.4,
  },
  scroll: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  formCard: {
    marginTop: -28,
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    ...theme.cardShadow,
  },
  fieldBlock: {
    gap: theme.spacing.xs,
  },
  fieldHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  fieldIconCircle: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fieldHeaderText: {
    flex: 1,
    gap: 1,
  },
  fieldLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  fieldHelper: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    // minHeight, not height — a fixed height silently clips a second
    // line if the selected city's name ever needs to wrap (a larger
    // system font-size setting, a long name), which reads as the last
    // character being cut off.
    minHeight: theme.inputSizes.md.height,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.inputSizes.md.paddingHorizontal,
    borderRadius: theme.inputSizes.md.radius,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.surface.default,
  },
  selectBoxError: {
    borderColor: theme.colors.error[500],
  },
  selectText: {
    flex: 1,
    fontSize: theme.inputSizes.md.fontSize,
    color: theme.colors.text.primary,
  },
  selectPlaceholder: {
    color: theme.colors.text.tertiary,
  },
  selectError: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error[500],
  },
  formError: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error[700],
    textAlign: "center",
  },
  submitButtonWrap: {
    marginTop: theme.spacing.xs,
    borderRadius: theme.buttonSizes.md.radius,
    backgroundColor: ACCENT,
    shadowColor: ACCENT_LIGHT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  submitButtonGradient: {
    height: theme.buttonSizes.md.height,
    borderRadius: theme.buttonSizes.md.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: {
    fontSize: theme.buttonSizes.md.fontSize,
    fontWeight: theme.fontWeight.bold as any,
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border.default,
  },
  // A real Pressable around "Login" (below), not a nested <Text onPress>
  // inside this row — nested-Text touch targets can fail to register taps
  // on Android in some RN versions even though they render correctly, so
  // this uses the one touch primitive guaranteed to fire reliably.
  //
  // flexShrink: 0 (not 1) is deliberate: `footerLine` uses `flex: 1`,
  // which in RN means flexBasis: 0 + flexGrow: 1 + flexShrink: 1 — so
  // without this override, the two divider lines' flexShrink:1 has
  // nothing to shrink (their own basis is already 0) and the *text*
  // ends up absorbing 100% of any width deficit instead, wrapping the
  // sentence mid-word on a device with a larger system font size. Fixed
  // flexShrink: 0 here means the dividers give way first — worst case
  // they shrink toward invisible, but the sentence itself never wraps.
  footerTextRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  footerLinkPill: {
    marginLeft: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[50],
  },
  footerLinkPillPressed: {
    backgroundColor: theme.colors.primary[100],
  },
  footerLink: {
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.primary[600],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(21,21,31,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: theme.colors.surface.default,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  modalTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  modalList: {
    maxHeight: 380,
  },
  cityOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  cityOptionLabel: {
    flexShrink: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
});
