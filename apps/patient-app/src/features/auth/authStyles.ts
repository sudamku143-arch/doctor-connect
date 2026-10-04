import { StyleSheet } from "react-native";
import { theme } from "@doctor-connect/theme";

export const authStyles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.default,
  },
  container: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: "center",
    gap: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  form: {
    gap: theme.spacing.md,
  },
  formError: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error[500],
  },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing.xxs,
  },
  linkText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  link: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.link,
    fontWeight: theme.fontWeight.bold as any,
  },
  forgotLink: {
    alignSelf: "flex-end",
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.link,
    fontWeight: theme.fontWeight.bold as any,
  },
  legalText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: "center",
  },
});
