import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
const RELATIONS = ["Spouse", "Child", "Parent", "Sibling", "Other"];

function ageFromDateOfBirth(dateOfBirth: string | null): string {
  if (!dateOfBirth) return "";
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return "";
  const diffMs = Date.now() - dob.getTime();
  const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
  return years >= 0 && years <= 120 ? String(years) : "";
}

export default function PatientDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { setPatientDetails } = useBookingDraft();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [who, setWho] = useState<Who>("myself");

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [mobile, setMobile] = useState("");
  const [relation, setRelation] = useState<string | undefined>(undefined);
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
        setAge(ageFromDateOfBirth(patient.date_of_birth));
        setGender(patient.gender ?? undefined);
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
    setRelation(undefined);
  }

  function selectFamilyMember(member: FamilyMember) {
    setWho({ familyMemberId: member.id, familyMemberName: member.name });
    setName(member.name);
    setAge(ageFromDateOfBirth(member.date_of_birth));
    setGender(member.gender ?? undefined);
    setRelation(member.relation);
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
    const result = patientDetailsSchema.safeParse({
      name,
      age,
      gender,
      mobile,
      relation: who === "myself" ? undefined : relation,
      reasonForVisit,
    });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof PatientDetailsInput, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof PatientDetailsInput;
        fieldErrors[key] = issue.message;
      }
      if (who !== "myself" && !relation) {
        fieldErrors.relation = "This field is required";
      }
      setErrors(fieldErrors);
      return;
    }
    if (who !== "myself" && !relation) {
      setErrors((prev) => ({ ...prev, relation: "This field is required" }));
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
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + theme.spacing.lg, paddingBottom: insets.bottom + 140 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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

      {who !== "myself" ? (
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Relation with patient *</Text>
          <View style={styles.chipRow}>
            {RELATIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setRelation(option)}
                style={[styles.relationChip, relation === option && styles.relationChipSelected]}
              >
                <Text style={[styles.relationChipLabel, relation === option && styles.relationChipLabelSelected]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
          {errors.relation ? <Text style={styles.errorText}>{errors.relation}</Text> : null}
        </View>
      ) : null}

      <TextField label="Patient name *" value={name} onChangeText={setName} error={errors.name} />

      <TextField
        label="Age *"
        placeholder="e.g. 28"
        keyboardType="number-pad"
        maxLength={3}
        value={age}
        onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ""))}
        error={errors.age}
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Gender *</Text>
        <View style={styles.genderRow}>
          {GENDERS.map((option) => (
            <Pressable
              key={option}
              onPress={() => setGender(option)}
              style={[styles.genderButton, gender === option && styles.genderButtonActive]}
            >
              <Text
                style={[styles.genderLabel, gender === option && styles.genderLabelActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {option.charAt(0) + option.slice(1).toLowerCase()}
              </Text>
            </Pressable>
          ))}
        </View>
        {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Mobile number *</Text>
        <View style={styles.mobileRow}>
          <View style={styles.mobilePrefix}>
            <Text style={styles.mobilePrefixText}>+91</Text>
          </View>
          <View style={styles.mobileInput}>
            <TextField
              label=""
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={(v) => setMobile(v.replace(/[^0-9]/g, ""))}
              error={errors.mobile}
            />
          </View>
        </View>
      </View>

      <TextField
        label="Reason for visit (optional)"
        placeholder="e.g. Fever, routine checkup"
        value={reasonForVisit}
        onChangeText={setReasonForVisit}
        error={errors.reasonForVisit}
      />

      <PrimaryButton label="Continue" onPress={handleContinue} style={styles.continueButton} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  fieldGroup: {
    gap: theme.spacing.xxs,
  },
  fieldLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.colors.text.secondary,
  },
  relationChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  relationChipSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  relationChipLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.primary,
  },
  relationChipLabelSelected: {
    color: theme.colors.text.inverse,
    fontWeight: theme.fontWeight.semibold as any,
  },
  genderRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  genderButton: {
    flex: 1,
    paddingHorizontal: theme.spacing.xxs,
    paddingVertical: theme.spacing.sm,
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
  mobileRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.xs,
  },
  mobilePrefix: {
    height: theme.inputSizes.md.height,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.inputSizes.md.radius,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.surface.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  mobilePrefixText: {
    fontSize: theme.inputSizes.md.fontSize,
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeight.medium as any,
  },
  mobileInput: {
    flex: 1,
  },
  errorText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error[500],
  },
  continueButton: {
    marginTop: theme.spacing.sm,
  },
});
