// Framework-agnostic elevation tokens. Consumers translate these into
// React Native's shadow*/elevation props or a web `box-shadow` string —
// keeps this package free of any RN or DOM dependency.

export interface Elevation {
  offsetX: number;
  offsetY: number;
  blur: number;
  opacity: number;
  color: string;
  androidElevation: number;
}

export const shadows: Record<"none" | "sm" | "md" | "lg", Elevation> = {
  none: { offsetX: 0, offsetY: 0, blur: 0, opacity: 0, color: "#15151F", androidElevation: 0 },
  sm: { offsetX: 0, offsetY: 1, blur: 3, opacity: 0.06, color: "#15151F", androidElevation: 2 },
  md: { offsetX: 0, offsetY: 4, blur: 12, opacity: 0.08, color: "#15151F", androidElevation: 4 },
  lg: { offsetX: 0, offsetY: 12, blur: 24, opacity: 0.1, color: "#15151F", androidElevation: 8 },
};

export function elevationToBoxShadow(e: Elevation): string {
  if (e.opacity === 0) return "none";
  const rgb = hexToRgb(e.color);
  return `${e.offsetX}px ${e.offsetY}px ${e.blur}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${e.opacity})`;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
