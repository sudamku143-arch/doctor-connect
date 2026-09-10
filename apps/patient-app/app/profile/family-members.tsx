import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";
import { EmptyState, ErrorState, LoadingState, PrimaryButton, SecondaryButton, TextField } from "@doctor-connect/ui-native";
import type { FamilyMember, Gender } from "@doctor-connect/types";
import { addFamilyMember, deleteFamilyMember, listFamilyMembers, updateFamilyMember } from "@/lib/api/familyMembers";
import { getGenderAvatarIcon } from "@/lib/genderAvatar";

const GENDERS: Gender[] = ["MALE", "FEMALE", "OTHER"];

export default function FamilyMembersScreen() {
  const insets = useSafeAreaInsets();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  function load() {
    listFamilyMembers()
      .then(setMembers)
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setRelation("");
    setGender(undefined);
  }

  function startEdit(member: FamilyMember) {
    setEditingId(member.id);
    setName(member.name);
    setRelation(member.relation);
    setGender(member.gender ?? undefined);
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim() || !relation.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateFamilyMember(editingId, { name: name.trim(), relation: relation.trim(), gender });
        setMembers((prev) => prev.map((m) => (m.id === editingId ? updated : m)));
      } else {
        const member = await addFamilyMember({ name: name.trim(), relation: relation.trim(), gender });
        setMembers((prev) => [...prev, member]);
      }
      resetForm();
    } catch {
      setError(editingId ? "Could not update family member. Please try again." : "Could not add family member. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteFamilyMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      if (editingId === id) resetForm();
    } catch {
      setError("Could not remove family member. Please try again.");
    }
  }

  if (loading) return <LoadingState title="Loading family members…" />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.lg }]}
    >
      {error ? <ErrorState title={error} onAction={load} actionLabel="Try again" /> : null}

      {members.length === 0 && !showForm ? (
        <EmptyState title="No family members yet" description="Add a family member to book on their behalf." />
      ) : (
        members.map((member) => (
          <View key={member.id} style={styles.memberRow}>
            <Pressable style={styles.memberInfo} onPress={() => startEdit(member)}>
              <View style={styles.memberAvatar}>
                <Ionicons name={getGenderAvatarIcon(member.gender)} size={22} color={theme.colors.primary[700]} />
              </View>
              <View>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRelation}>{member.relation}</Text>
              </View>
            </Pressable>
            <View style={styles.memberActions}>
              <Pressable onPress={() => startEdit(member)} hitSlop={8}>
                <Ionicons name="pencil-outline" size={theme.iconSizes.md} color={theme.colors.text.secondary} />
              </Pressable>
              <Pressable onPress={() => handleDelete(member.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={theme.iconSizes.md} color={theme.colors.error[500]} />
              </Pressable>
            </View>
          </View>
        ))
      )}

      {showForm ? (
        <View style={styles.form}>
          <TextField label="Name" value={name} onChangeText={setName} />
          <TextField label="Relation" placeholder="e.g. Spouse, Child, Parent" value={relation} onChangeText={setRelation} />
          <View style={styles.genderRow}>
            {GENDERS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setGender(option)}
                style={[styles.genderButton, gender === option && styles.genderButtonActive]}
              >
                <Text style={[styles.genderLabel, gender === option && styles.genderLabelActive]} numberOfLines={1}>
                  {option.charAt(0) + option.slice(1).toLowerCase()}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.formActions}>
            <SecondaryButton label="Cancel" onPress={resetForm} style={styles.formButton} />
            <PrimaryButton label="Save" onPress={handleSave} loading={saving} style={styles.formButton} />
          </View>
        </View>
      ) : (
        <PrimaryButton label="+ Add Family Member" onPress={() => setShowForm(true)} />
      )}
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
    gap: theme.spacing.sm,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  memberInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
  },
  memberActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  memberName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  memberRelation: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  form: {
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
  formActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  formButton: {
    flex: 1,
  },
});
