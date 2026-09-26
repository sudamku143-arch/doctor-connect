import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";

export interface TextFieldProps extends Omit<TextInputProps, "style"> {
  /** Omit when the caller renders its own label/helper block above the
   * field (e.g. an icon-badge + bold-label + helper-text header) instead
   * of using this component's built-in single-line label. */
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Makes the left icon tappable (e.g. "use my current location" on an
   * address field) instead of purely decorative. Omit to keep the icon
   * static, as every other field already does. */
  onLeftIconPress?: () => void;
  /** Swaps the left icon for a spinner while onLeftIconPress's action is
   * in flight. */
  leftIconBusy?: boolean;
  /** Soft elevated-card look (shadow instead of a flat border, glows on focus) instead of the default flat field. */
  elevated?: boolean;
}

export function TextField({
  label,
  error,
  helperText,
  leftIcon,
  onLeftIconPress,
  leftIconBusy = false,
  elevated = false,
  onFocus,
  onBlur,
  secureTextEntry,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const sizeTokens = theme.inputSizes.md;
  const iconColor = elevated ? theme.colors.primary[300] : theme.colors.text.tertiary;

  const iconContent = leftIconBusy ? (
    <ActivityIndicator size="small" color={iconColor} />
  ) : leftIcon ? (
    <Ionicons name={leftIcon} size={theme.iconSizes.sm} color={onLeftIconPress ? theme.colors.primary[500] : iconColor} />
  ) : null;

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, elevated && styles.labelOnDark]}>{label}</Text> : null}
      <View style={styles.inputWrapper}>
        {leftIcon ? (
          onLeftIconPress ? (
            <Pressable
              onPress={onLeftIconPress}
              disabled={leftIconBusy}
              hitSlop={8}
              style={[styles.leftIconWrap, { height: sizeTokens.height }]}
            >
              {iconContent}
            </Pressable>
          ) : (
            <View style={[styles.leftIconWrap, { height: sizeTokens.height }]}>{iconContent}</View>
          )
        ) : null}
        <TextInput
          placeholderTextColor={theme.colors.text.tertiary}
          secureTextEntry={secureTextEntry && !revealed}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            {
              height: sizeTokens.height,
              paddingHorizontal: sizeTokens.paddingHorizontal,
              paddingLeft: leftIcon ? sizeTokens.height : sizeTokens.paddingHorizontal,
              paddingRight: secureTextEntry ? sizeTokens.height : sizeTokens.paddingHorizontal,
              fontSize: sizeTokens.fontSize,
              borderRadius: sizeTokens.radius,
              borderColor: error
                ? theme.colors.error[500]
                : focused
                  ? theme.colors.border.focus
                  : elevated
                    ? theme.colors.primary[100]
                    : theme.colors.border.default,
            },
            elevated && styles.elevated,
            elevated && focused && styles.elevatedFocused,
          ]}
          {...inputProps}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
            style={[styles.revealButton, { height: sizeTokens.height }]}
          >
            <Ionicons name={revealed ? "eye-off-outline" : "eye-outline"} size={theme.iconSizes.sm} color={iconColor} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xxs,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.secondary,
  },
  // `elevated` is only ever used on the dark hero/gradient auth screens
  // (clinic + patient login, clinic register) — the default grey label
  // reads fine on the white cards used everywhere else, but is nearly
  // invisible against a dark purple background.
  labelOnDark: {
    color: "rgba(255,255,255,0.92)",
  },
  inputWrapper: {
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.surface.default,
  },
  elevated: {
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  elevatedFocused: {
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  revealButton: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  leftIconWrap: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  errorText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error[500],
  },
  helperText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
});
