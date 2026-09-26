import type { Role } from "@doctor-connect/types";

// Fixed (not personalized) illustrated avatars — one per staff role —
// from DiceBear's free avataaars style, rendered as PNG so a plain RN
// <Image> can show it with no extra SVG-rendering dependency. Staff
// profiles carry no gender field (unlike patients), so the avatar is
// picked by role instead. Seeds are pinned so the same image is used
// for every receptionist / clinic admin.
const DICEBEAR_BASE = "https://api.dicebear.com/9.x/avataaars/png";

export function getRoleAvatarUrl(role: Role | null | undefined): string {
  if (role === "CLINIC_ADMIN") {
    return (
      `${DICEBEAR_BASE}?seed=clinicadmin1&size=200&backgroundColor=ddd6fe` +
      `&top=shortRound,shortFlat,bob&facialHairProbability=0` +
      `&clothing=blazerAndShirt,blazerAndSweater&accessoriesProbability=0` +
      `&mouth=default,smile,twinkle&eyes=default,happy,wink`
    );
  }
  return (
    `${DICEBEAR_BASE}?seed=receptionist1&size=200&backgroundColor=c7d2fe` +
    `&top=bob,curly,straight02&facialHairProbability=0` +
    `&clothing=collarAndSweater,shirtScoopNeck&accessoriesProbability=0` +
    `&mouth=default,smile,twinkle&eyes=default,happy,wink`
  );
}
