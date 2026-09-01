import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { theme } from "@doctor-connect/theme";
import { ErrorState, LoadingState, PrimaryButton, SecondaryButton, TextField } from "@doctor-connect/ui-native";
import { useClinic } from "@/features/clinic/ClinicContext";
import { updateClinic } from "@/lib/api/clinic";

export default function ClinicProfileScreen() {
  const { staff, isLoading, error, reload } = useClinic();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (isLoading) return <LoadingState title="Loading clinic profile…" />;
  if (error || !staff) return <ErrorState title={error ?? "Something went wrong."} />;

  const canEdit = staff.role === "CLINIC_ADMIN";

  function startEditing() {
    setName(staff!.clinic.name);
    setAddress(staff!.clinic.address);
    setCity(staff!.clinic.city);
    setPhone(staff!.clinic.phone ?? "");
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await updateClinic(staff!.clinic.id, { name, address, city, phone: phone || null });
      reload();
      setEditing(false);
    } catch {
      setSaveError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <TextField label="Clinic name" value={name} onChangeText={setName} />
        <TextField label="Address" value={address} onChangeText={setAddress} />
        <TextField label="City" value={city} onChangeText={setCity} />
        <TextField label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
        <SecondaryButton label="Cancel" onPress={() => setEditing(false)} />
        <PrimaryButton label="Save" onPress={handleSave} loading={saving} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{staff.clinic.name}</Text>
      <Text style={styles.meta}>
        {staff.clinic.address}, {staff.clinic.city}
      </Text>
      {staff.clinic.phone ? <Text style={styles.meta}>{staff.clinic.phone}</Text> : null}
      <Text style={styles.status}>Verification: {staff.clinic.verification_status}</Text>

      {canEdit ? (
        <SecondaryButton label="Edit Clinic Profile" onPress={startEditing} fullWidth={false} />
      ) : (
        <Text style={styles.helperText}>Only a clinic admin can edit this profile.</Text>
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
  name: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  meta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  status: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.sm,
  },
  helperText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  error: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error[700],
    textAlign: "center",
  },
});
