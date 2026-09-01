export * from "./colors";
export * from "./spacing";
export * from "./radii";
export * from "./shadows";
export * from "./typography";
export * from "./components";

import { colors } from "./colors";
import { spacing } from "./spacing";
import { radii } from "./radii";
import { shadows } from "./shadows";
import { fontFamily, fontSize, fontWeight, lineHeight } from "./typography";
import { buttonSizes, inputSizes, badgeSizes, iconSizes, cardStyle } from "./components";

export const theme = {
  colors,
  spacing,
  radii,
  shadows,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  buttonSizes,
  inputSizes,
  badgeSizes,
  iconSizes,
  cardStyle,
} as const;

export type Theme = typeof theme;
