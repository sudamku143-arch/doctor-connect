// Static for Phase 1 UI only — replaced by a `specialties` table query in
// Phase 2 once the Patient app backend is wired up.
export const POPULAR_SPECIALTIES = [
  { slug: "general-physician", name: "General Physician", icon: "medkit" as const },
  { slug: "pediatrician", name: "Pediatrician", icon: "happy" as const },
  { slug: "dermatologist", name: "Dermatologist", icon: "sparkles" as const },
  { slug: "dentist", name: "Dentist", icon: "medical" as const },
  { slug: "cardiologist", name: "Cardiologist", icon: "heart" as const },
  { slug: "orthopedic", name: "Orthopedic", icon: "body" as const },
  { slug: "gynecologist", name: "Gynecologist", icon: "female" as const },
  { slug: "ophthalmologist", name: "Ophthalmologist", icon: "eye" as const },
];
