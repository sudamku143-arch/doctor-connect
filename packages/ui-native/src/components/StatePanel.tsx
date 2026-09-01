import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { theme } from "@doctor-connect/theme";
import { PrimaryButton } from "./Button";

interface StatePanelProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant: "empty" | "loading" | "error";
}

function StatePanel({ title, description, actionLabel, onAction, variant }: StatePanelProps) {
  return (
    <View style={styles.container}>
      {variant === "loading" ? (
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      ) : null}
      <Text style={[styles.title, variant === "error" && { color: theme.colors.error[700] }]}>
        {title}
      </Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

export function EmptyState(props: Omit<StatePanelProps, "variant">) {
  return <StatePanel {...props} variant="empty" />;
}

export function LoadingState(props: Omit<StatePanelProps, "variant" | "actionLabel" | "onAction">) {
  return <StatePanel {...props} variant="loading" />;
}

export function ErrorState(props: Omit<StatePanelProps, "variant">) {
  return (
    <StatePanel
      {...props}
      title={props.title || "Something went wrong. Please try again."}
      actionLabel={props.actionLabel ?? "Try again"}
      variant="error"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
    textAlign: "center",
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  action: {
    marginTop: theme.spacing.xs,
  },
});
