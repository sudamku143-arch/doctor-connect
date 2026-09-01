import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@doctor-connect/theme";
import { EmptyState, ErrorState, LoadingState, PrimaryButton, TextField } from "@doctor-connect/ui-native";
import type { FamilyMember } from "@doctor-connect/types";
import { addFamilyMember, deleteFamilyMember, listFamilyMembers } from "@/lib/api/familyMembers";

export default function FamilyMembersScreen() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    listFamilyMembers()
      .then(setMembers)
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd() {
    if (!name.trim() || !relation.trim()) return;
    setSaving(true);
    try {
      const member = await addFamilyMember({ name: name.trim(), relation: relation.trim() });
      setMembers((prev) => [...prev, member]);
      setName("");
      setRelation("");
      setShowForm(false);
    } catch {
      setError("Could not add family member. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteFamilyMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError("Could not remove family member. Please try again.");
    }
  }

  if (loading) return <LoadingState title="Loading family members…" />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {error ? <ErrorState title={error} onAction={load} actionLabel="Try again" /> : null}

      {members.length === 0 && !showForm ? (
        <EmptyState title="No family members yet" description="Add a family member to book on their behalf." />
      ) : (
        members.map((member) => (
          <View key={member.id} style={styles.memberRow}>
            <View>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRelation}>{member.relation}</Text>
            </View>
            <Pressable onPress={() => handleDelete(member.id)}>
              <Ionicons name="trash-outline" size={theme.iconSizes.md} color={theme.colors.error[500]} />
            </Pressable>
          </View>
        ))
      )}

      {showForm ? (
        <View style={styles.form}>
          <TextField label="Name" value={name} onChangeText={setName} />
          <TextField label="Relation" placeholder="e.g. Spouse, Child, Parent" value={relation} onChangeText={setRelation} />
          <PrimaryButton label="Save" onPress={handleAdd} loading={saving} />
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
});
