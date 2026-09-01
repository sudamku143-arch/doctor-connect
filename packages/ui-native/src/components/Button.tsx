import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
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
}: ButtonProps) {
  const sizeTokens = theme.buttonSizes[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles(variant, isDisabled),
        {
          height: sizeTokens.height,
          paddingHorizontal: sizeTokens.paddingHorizontal,
          borderRadius: sizeTokens.radius,
          opacity: pressed && !isDisabled ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor(variant)} />
      ) : (
        <Text
          style={[styles.label, { fontSize: sizeTokens.fontSize, color: textColor(variant, isDisabled) }]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function PrimaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="primary" />;
}

export function SecondaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="secondary" />;
}

function variantStyles(variant: Variant, isDisabled: boolean): ViewStyle {
  if (isDisabled) {
    return { backgroundColor: theme.colors.neutral[100], borderWidth: 0 };
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

function textColor(variant: Variant, isDisabled = false): string {
  if (isDisabled) return theme.colors.text.disabled;
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
});
