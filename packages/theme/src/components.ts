import { radii } from "./radii";
import { fontSize } from "./typography";

// Cross-app sizing contracts for shared component variants, so a "md" button
// or "lg" badge means the same thing in every app.

export const buttonSizes = {
  sm: { height: 36, paddingHorizontal: 14, fontSize: fontSize.sm, radius: radii.sm },
  md: { height: 48, paddingHorizontal: 20, fontSize: fontSize.base, radius: radii.md },
  lg: { height: 56, paddingHorizontal: 24, fontSize: fontSize.md, radius: radii.md },
} as const;

export const inputSizes = {
  md: { height: 52, paddingHorizontal: 16, fontSize: fontSize.base, radius: radii.md },
} as const;

export const badgeSizes = {
  sm: { paddingHorizontal: 8, paddingVertical: 2, fontSize: fontSize.xs, radius: radii.pill },
  md: { paddingHorizontal: 10, paddingVertical: 4, fontSize: fontSize.sm, radius: radii.pill },
} as const;

export const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const cardStyle = {
  radius: radii.lg,
  padding: 16,
} as const;
