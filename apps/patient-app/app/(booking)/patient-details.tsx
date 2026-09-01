import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { ErrorState, LoadingState, PrimaryButton, TextField } from "@doctor-connect/ui-native";
import type { FamilyMember, Gender } from "@doctor-connect/types";
import { patientDetailsSchema, type PatientDetailsInput } from "@doctor-connect/validation";
import { useBookingDraft } from "@/features/booking/BookingDraftContext";
import { addFamilyMember, listFamilyMembers } from "@/lib/api/familyMembers";
import { getMyPatientRecord, getMyProfile } from "@/lib/api/profile";

type Who = "myself" | { familyMemberId: string; familyMemberName: string };

const GENDERS: Gender[] = ["MALE", "FEMALE", "OTHER"];

export default function PatientDetailsScreen() {
  const { setPatientDetails } = useBookingDraft();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [who, setWho] = useState<Who>("myself");

  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [mobile, setMobile] = useState("");
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof PatientDetailsInput, string>>>({});

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRelation, setNewMemberRelation] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMyProfile(), getMyPatientRecord(), listFamilyMembers()])
      .then(([profile, patient, members]) => {
        if (cancelled) return;
        setName(profile.full_name);
        setMobile(profile.phone ?? "");
        setDateOfBirth(patient.date_of_birth ?? "");
        setGender(patient.gender ?? "MALE");
        setFamilyMembers(members);
      })
      .catch(() => !cancelled && setLoadError("Something went wrong. Please try again."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function selectMyself() {
    setWho("myself");
  }

  function selectFamilyMember(member: FamilyMember) {
    setWho({ familyMemberId: member.id, familyMemberName: member.name });
    setName(member.name);
    setDateOfBirth(member.date_of_birth ?? "");
    setGender(member.gender ?? "MALE");
  }

  async function handleAddMember() {
    if (!newMemberName.trim() || !newMemberRelation.trim()) return;
    setAddingMember(true);
    try {
      const member = await addFamilyMember({ name: newMemberName.trim(), relation: newMemberRelation.trim() });
      setFamilyMembers((prev) => [...prev, member]);
      selectFamilyMember(member);
      setShowAddMember(false);
      setNewMemberName("");
      setNewMemberRelation("");
    } catch {
      setLoadError("Could not add family member. Please try again.");
    } finally {
      setAddingMember(false);
    }
  }

  function handleContinue() {
    const result = patientDetailsSchema.safeParse({ name, dateOfBirth, gender, mobile, reasonForVisit });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof PatientDetailsInput, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof PatientDetailsInput;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setPatientDetails({
      patientDetails: result.data,
      familyMemberId: who === "myself" ? null : who.familyMemberId,
      familyMemberName: who === "myself" ? null : who.familyMemberName,
    });
    router.push("/(booking)/summary");
  }

  if (loading) return <LoadingState title="Loading your details…" />;
  if (loadError) return <ErrorState title={loadError} onAction={() => setLoadError(null)} actionLabel="Dismiss" />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.toggleRow}>
        <Pressable
          onPress={selectMyself}
          style={[styles.toggleButton, who === "myself" && styles.toggleButtonActive]}
        >
          <Text style={[styles.toggleLabel, who === "myself" && styles.toggleLabelActive]}>Myself</Text>
        </Pressable>
        <Pressable
          onPress={() => familyMembers[0] && selectFamilyMember(familyMembers[0])}
          style={[styles.toggleButton, who !== "myself" && styles.toggleButtonActive]}
        >
          <Text style={[styles.toggleLabel, who !== "myself" && styles.toggleLabelActive]}>Family Member</Text>
        </Pressable>
      </View>

      {who !== "myself" ? (
        <View style={styles.chipRow}>
          {familyMembers.map((member) => {
            const isSelected = who.familyMemberId === member.id;
            return (
              <Pressable
                key={member.id}
                onPress={() => selectFamilyMember(member)}
                style={[styles.memberChip, isSelected && styles.memberChipSelected]}
              >
                <Text style={[styles.memberChipLabel, isSelected && styles.memberChipLabelSelected]}>
                  {member.name} · {member.relation}
                </Text>
              </Pressable>
            );
          })}
          <Pressable onPress={() => setShowAddMember((prev) => !prev)} style={styles.addMemberChip}>
            <Text style={styles.addMemberLabel}>+ Add family member</Text>
          </Pressable>
        </View>
      ) : null}

      {showAddMember ? (
        <View style={styles.addMemberForm}>
          <TextField label="Name" value={newMemberName} onChangeText={setNewMemberName} />
          <TextField
            label="Relation"
            placeholder="e.g. Spouse, Child, Parent"
            value={newMemberRelation}
            onChangeText={setNewMemberRelation}
          />
          <PrimaryButton label="Save family member" onPress={handleAddMember} loading={addingMember} />
        </View>
      ) : null}

      <TextField label="Patient name" value={name} onChangeText={setName} error={errors.name} />
      <TextField
        label="Date of birth"
        placeholder="YYYY-MM-DD"
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        error={errors.dateOfBirth}
      />

      <View style={styles.genderRow}>
        {GENDERS.map((option) => (
          <Pressable
            key={option}
            onPress={() => setGender(option)}
            style={[styles.genderButton, gender === option && styles.genderButtonActive]}
          >
            <Text style={[styles.genderLabel, gender === option && styles.genderLabelActive]}>
              {option.charAt(0) + option.slice(1).toLowerCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextField
        label="Mobile number"
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
        error={errors.mobile}
      />
      <TextField
        label="Reason for visit"
        placeholder="e.g. Fever, routine checkup"
        value={reasonForVisit}
        onChangeText={setReasonForVisit}
        error={errors.reasonForVisit}
      />

      <PrimaryButton label="Continue" onPress={handleContinue} style={styles.continueButton} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  toggleLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  toggleLabelActive: {
    color: theme.colors.text.inverse,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  memberChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  memberChipSelected: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[500],
  },
  memberChipLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  memberChipLabelSelected: {
    color: theme.colors.primary[700],
    fontWeight: theme.fontWeight.semibold as any,
  },
  addMemberChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderStyle: "dashed",
  },
  addMemberLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[600],
  },
  addMemberForm: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.subtle,
  },
  genderRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  genderButton: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    alignItems: "center",
  },
  genderButtonActive: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[500],
  },
  genderLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  genderLabelActive: {
    color: theme.colors.primary[700],
    fontWeight: theme.fontWeight.semibold as any,
  },
  continueButton: {
    marginTop: theme.spacing.sm,
  },
});
