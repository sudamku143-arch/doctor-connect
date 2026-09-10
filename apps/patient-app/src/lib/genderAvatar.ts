import type { Ionicons } from "@expo/vector-icons";
import type { Gender } from "@doctor-connect/types";

export function getGenderAvatarIcon(gender: Gender | null | undefined): keyof typeof Ionicons.glyphMap {
  if (gender === "MALE") return "man";
  if (gender === "FEMALE") return "woman";
  return "person";
}

// Fixed (not personalized) illustrated avatars — one per gender — from
// DiceBear's free avataaars style, rendered as PNG so a plain RN <Image>
// can show it with no extra SVG-rendering dependency. Seeds + style params
// are pinned so the same three images are used for every patient.
const DICEBEAR_BASE = "https://api.dicebear.com/9.x/avataaars/png";

export function getGenderAvatarUrl(gender: Gender | null | undefined): string {
  if (gender === "MALE") {
    return (
      `${DICEBEAR_BASE}?seed=maleavatar2&size=200&backgroundColor=c7d2fe` +
      `&top=shortFlat,shortRound,theCaesar,shortWaved` +
      `&facialHair=beardLight,beardMedium&facialHairProbability=90` +
      `&clothing=blazerAndShirt,collarAndSweater&accessoriesProbability=0` +
      `&mouth=default,smile,twinkle&eyes=default,happy,wink`
    );
  }
  if (gender === "FEMALE") {
    return (
      `${DICEBEAR_BASE}?seed=femaleavatar2&size=200&backgroundColor=fbcfe8` +
      `&top=bob,curly,longButNotTooLong,straight02&facialHairProbability=0` +
      `&clothing=blazerAndSweater,collarAndSweater,shirtScoopNeck&accessoriesProbability=0` +
      `&mouth=default,smile,twinkle&eyes=default,happy,wink`
    );
  }
  return (
    `${DICEBEAR_BASE}?seed=neutralavatar1&size=200&backgroundColor=ddd6fe` +
    `&top=shortCurly,shortWaved,frizzle,shaggy&facialHairProbability=0` +
    `&clothing=hoodie,shirtCrewNeck,graphicShirt&accessoriesProbability=0` +
    `&mouth=default,smile,twinkle&eyes=default,happy,wink`
  );
}
