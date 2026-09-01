// Premium healthcare palette: light/white surfaces, indigo/purple as the
// single confident accent, muted neutrals, and restrained semantic colors.
// Deliberately not a "generic template" rainbow — see PROMPT.md section 3.

export const primary = {
  50: "#F4F2FF",
  100: "#EAE5FF",
  200: "#D3C9FF",
  300: "#B3A0FF",
  400: "#9575FF",
  500: "#7C4DFF", // primary accent
  600: "#6C3CE6",
  700: "#5A2FC2",
  800: "#48249B",
  900: "#361B73",
} as const;

export const neutral = {
  0: "#FFFFFF",
  50: "#F8F8FB",
  100: "#F1F1F6",
  200: "#E4E4EC",
  300: "#D1D1DC",
  400: "#A6A6B8",
  500: "#7C7C91",
  600: "#5B5B70",
  700: "#40404F",
  800: "#28283A",
  900: "#15151F",
} as const;

export const success = {
  50: "#EAFBF2",
  500: "#16A34A",
  700: "#0F7A38",
} as const;

export const warning = {
  50: "#FFF8EB",
  500: "#D97706",
  700: "#A65A05",
} as const;

export const error = {
  50: "#FDEEEE",
  500: "#DC2626",
  700: "#A81E1E",
} as const;

export const info = {
  50: "#EDF6FF",
  500: "#2563EB",
  700: "#1D4ED8",
} as const;

export const colors = {
  primary,
  neutral,
  success,
  warning,
  error,
  info,
  background: {
    default: neutral[0],
    subtle: neutral[50],
    inverse: neutral[900],
  },
  surface: {
    default: neutral[0],
    raised: neutral[0],
    subtle: neutral[50],
  },
  border: {
    default: neutral[200],
    subtle: neutral[100],
    strong: neutral[300],
    focus: primary[500],
  },
  text: {
    primary: neutral[900],
    secondary: neutral[600],
    tertiary: neutral[500],
    disabled: neutral[400],
    inverse: neutral[0],
    link: primary[600],
  },
  status: {
    confirmed: info[500],
    pending: warning[500],
    success: success[500],
    danger: error[500],
    neutral: neutral[500],
  },
} as const;

export type Colors = typeof colors;
