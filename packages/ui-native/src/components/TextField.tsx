import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { theme } from "@doctor-connect/theme";

export interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  error?: string;
  helperText?: string;
}

export function TextField({ label, error, helperText, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const sizeTokens = theme.inputSizes.md;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.text.tertiary}
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
  input: {
    borderWidth: 1,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.surface.default,
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
