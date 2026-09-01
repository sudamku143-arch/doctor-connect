import type { Ionicons } from "@expo/vector-icons";

// Maps supabase/seed/seed.sql's specialties.icon values to a renderable
// Ionicons glyph name — the DB stores a plain descriptive string, not an
// icon-library-specific name.
const ICON_BY_DB_VALUE: Record<string, keyof typeof Ionicons.glyphMap> = {
  stethoscope: "medkit",
  baby: "happy",
  skin: "sparkles",
  tooth: "medical",
  heart: "heart",
  bone: "body",
  female: "female",
  eye: "eye",
};

export function getSpecialtyIcon(dbIconValue: string | null): keyof typeof Ionicons.glyphMap {
  if (dbIconValue && dbIconValue in ICON_BY_DB_VALUE) {
    return ICON_BY_DB_VALUE[dbIconValue];
  }
  return "medical-outline";
}
