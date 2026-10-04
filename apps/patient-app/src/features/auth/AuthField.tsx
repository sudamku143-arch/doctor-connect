import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Light "premium card" input for the Create Account screen: 14px radius,
// hairline slate border, leading outline icon, and a soft indigo focus ring.
// Kept separate from ui-native's TextField (used app-wide, and in its
// `elevated` variant on the dark login/register screens) so this look
// doesn't leak into every other form.

export const AUTH_COLORS = {
  ink: "#0F172A",
  inkSecondary: "#64748B",
  inkTertiary: "#94A3B8",
  border: "#E2E8F0",
  surface: "#FFFFFF",
  background: "#F8FAFC",
  indigo: "#4F46E5",
  indigoLight: "#6366F1",
  error: "#DC2626",
};

const RADIUS = 14;
const RING = 3;

export interface AuthFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
}

export function AuthField({ label, icon, error, secureTextEntry, onFocus, onBlur, ...inputProps }: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? AUTH_COLORS.error : focused ? AUTH_COLORS.indigoLight : AUTH_COLORS.border;
  const iconColor = focused ? AUTH_COLORS.indigo : AUTH_COLORS.inkTertiary;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {/* The ring is an always-present transparent border that only takes a
          color on focus, so focusing never shifts the layout. */}
      <View
        style={[
          styles.ring,
          focused && { borderColor: error ? "rgba(220,38,38,0.14)" : "rgba(99,102,241,0.18)" },
        ]}
      >
        <View style={[styles.field, { borderColor }, focused && styles.fieldFocused]}>
          <Ionicons name={icon} size={19} color={iconColor} style={styles.leadingIcon} />
          <TextInput
            placeholderTextColor={AUTH_COLORS.inkTertiary}
            secureTextEntry={secureTextEntry && !revealed}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={styles.input}
            {...inputProps}
          />
          {secureTextEntry ? (
            <Pressable
              onPress={() => setRevealed((v) => !v)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={revealed ? "Hide password" : "Show password"}
              style={styles.trailingButton}
            >
              <Ionicons name={revealed ? "eye-off-outline" : "eye-outline"} size={19} color={AUTH_COLORS.inkTertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: AUTH_COLORS.ink,
    marginLeft: 2,
  },
  ring: {
    borderWidth: RING,
    borderColor: "transparent",
    borderRadius: RADIUS + RING,
    margin: -RING,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1,
    borderRadius: RADIUS,
    backgroundColor: AUTH_COLORS.surface,
    paddingHorizontal: 14,
    shadowColor: AUTH_COLORS.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  fieldFocused: {
    shadowColor: AUTH_COLORS.indigoLight,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 2,
  },
  leadingIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: AUTH_COLORS.ink,
  },
  trailingButton: {
    height: "100%",
    paddingLeft: 10,
    justifyContent: "center",
  },
  error: {
    fontSize: 12,
    color: AUTH_COLORS.error,
    marginLeft: 2,
  },
});
