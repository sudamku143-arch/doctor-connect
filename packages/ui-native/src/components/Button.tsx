import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";

export type ButtonSize = keyof typeof theme.buttonSizes;
type Variant = "primary" | "secondary" | "danger";

export interface ButtonProps {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: Variant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  /** Recolors a "secondary" button to a subtle red tint for destructive-
   * but-not-heavy actions (e.g. "Logout") — `variant="danger"` is a solid
   * fill meant for confirm-style actions and is too loud for this. */
  tone?: "danger";
  /** Optional leading icon, same color as the label. */
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  textStyle,
  tone,
  icon,
}: ButtonProps) {
  const sizeTokens = theme.buttonSizes[size];
  const isDisabled = disabled || loading;
  // Primary CTAs get the brand gradient; small inline buttons (e.g. a
  // "Book Appointment" button repeated down a list of cards) keep the
  // gradient fill but skip the glow shadow so a scrolling list of them
  // doesn't turn into a wall of glowing boxes.
  const isGradient = variant === "primary" && !isDisabled;
  const showGlow = isGradient && size !== "sm";

  const boxStyle = {
    height: sizeTokens.height,
    paddingHorizontal: sizeTokens.paddingHorizontal,
    borderRadius: sizeTokens.radius,
  };

  const resolvedTextColor = textColor(variant, isDisabled, tone);
  const content = loading ? (
    <ActivityIndicator color={resolvedTextColor} />
  ) : (
    <View style={styles.contentRow}>
      {icon ? <Ionicons name={icon} size={sizeTokens.fontSize + 2} color={resolvedTextColor} /> : null}
      <Text style={[styles.label, { fontSize: sizeTokens.fontSize, color: resolvedTextColor }, textStyle]}>{label}</Text>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        {
          alignSelf: fullWidth ? "stretch" : "flex-start",
          borderRadius: sizeTokens.radius,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        showGlow && styles.glow,
        style,
      ]}
    >
      {({ pressed }) =>
        isGradient ? (
          <LinearGradient
            colors={["#9D71FF", theme.colors.primary[500], theme.colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.base, boxStyle, { opacity: pressed ? 0.9 : 1 }]}
          >
            {content}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.base,
              boxStyle,
              variantStyles(variant, isDisabled, tone),
              { opacity: pressed && !isDisabled ? 0.85 : 1 },
            ]}
          >
            {content}
          </View>
        )
      }
    </Pressable>
  );
}

export function PrimaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="primary" />;
}

export function SecondaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="secondary" />;
}

function variantStyles(variant: Variant, isDisabled: boolean, tone?: "danger"): ViewStyle {
  if (isDisabled) {
    return { backgroundColor: theme.colors.neutral[100], borderWidth: 0 };
  }
  if (variant === "secondary" && tone === "danger") {
    return { backgroundColor: theme.colors.error[50], borderWidth: 1, borderColor: theme.colors.error[500] };
  }
  switch (variant) {
    case "primary":
      return { backgroundColor: theme.colors.primary[500], borderWidth: 0 };
    case "danger":
      return { backgroundColor: theme.colors.error[500], borderWidth: 0 };
    case "secondary":
    default:
      return { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.colors.border.strong };
  }
}

function textColor(variant: Variant, isDisabled = false, tone?: "danger"): string {
  if (isDisabled) return theme.colors.text.disabled;
  if (variant === "secondary" && tone === "danger") return theme.colors.error[700];
  if (variant === "secondary") return theme.colors.text.primary;
  return theme.colors.text.inverse;
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  label: {
    fontWeight: theme.fontWeight.semibold as any,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  glow: {
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 8,
  },
});
