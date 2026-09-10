import type { MaterialCommunityIcons } from "@expo/vector-icons";

// Maps supabase/seed/seed.sql's specialties.icon values to a renderable
// MaterialCommunityIcons glyph name — the DB stores a plain descriptive
// string, not an icon-library-specific name. MaterialCommunityIcons is used
// (rather than Ionicons) because it has far more detailed, specialty-specific
// glyphs (mortar-pestle, stethoscope, tooth, lungs, etc.).
const ICON_BY_DB_VALUE: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  stethoscope: "stethoscope",
  baby: "baby-face-outline",
  skin: "spa-outline",
  tooth: "tooth",
  heart: "heart-pulse",
  bone: "bone",
  female: "gender-female",
  eye: "eye-outline",
  ear: "ear-hearing",
  mind: "emoticon-happy-outline",
  nerves: "brain",
  hormone: "flask-outline",
  kidney: "water",
  stomach: "stomach",
  lungs: "lungs",
  urology: "gender-male",
  cancer: "ribbon",
  joint: "arm-flex-outline",
  surgery: "medical-bag",
  physio: "run-fast",
  diet: "food-apple-outline",
  ayurveda: "mortar-pestle",
  homeopathy: "flower-tulip-outline",
};

export function getSpecialtyIcon(dbIconValue: string | null): keyof typeof MaterialCommunityIcons.glyphMap {
  if (dbIconValue && dbIconValue in ICON_BY_DB_VALUE) {
    return ICON_BY_DB_VALUE[dbIconValue];
  }
  return "medical-bag";
}
