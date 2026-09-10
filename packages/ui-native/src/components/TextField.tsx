import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";

export interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  error?: string;
  helperText?: string;
}

export function TextField({
  label,
  error,
  helperText,
  onFocus,
  onBlur,
  secureTextEntry,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const sizeTokens = theme.inputSizes.md;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
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
              paddingRight: secureTextEntry ? sizeTokens.height : sizeTokens.paddingHorizontal,
              fontSize: sizeTokens.fontSize,
              borderRadius: sizeTokens.radius,
              borderColor: error
                ? theme.colors.error[500]
                : focused
                  ? theme.colors.border.focus
                  : theme.colors.border.default,
            },
          ]}
          {...inputProps}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
            style={[styles.revealButton, { height: sizeTokens.height }]}
          >
            <Ionicons
              name={revealed ? "eye-off-outline" : "eye-outline"}
              size={theme.iconSizes.sm}
              color={theme.colors.text.tertiary}
            />
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
  inputWrapper: {
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.surface.default,
  },
  revealButton: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
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
