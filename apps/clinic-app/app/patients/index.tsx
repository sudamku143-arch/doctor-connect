import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { EmptyState, ErrorState, LoadingState } from "@doctor-connect/ui-native";
import { searchPatients, type PatientSearchResult } from "@/lib/api/patients";

export default function PatientManagementScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      setResults(await searchPatients(query));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Patient Management</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={theme.colors.text.tertiary} />
        <TextInput
          placeholder="Search by name or mobile number"
          placeholderTextColor={theme.colors.text.tertiary}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Pressable onPress={handleSearch}>
          <Ionicons name="arrow-forward-circle" size={28} color={theme.colors.primary[500]} />
        </Pressable>
      </View>

      {loading ? (
        <LoadingState title="Searching…" />
      ) : error ? (
        <ErrorState title={error} />
      ) : !searched ? (
        <EmptyState title="Search for a patient" description="Search by name or mobile number." />
      ) : results.length === 0 ? (
        <EmptyState title="No patients found" />
      ) : (
        results.map((patient) => (
          <Pressable key={patient.id} style={styles.row} onPress={() => router.push(`/patients/${patient.id}`)}>
            <Text style={styles.patientName}>{patient.profile.full_name}</Text>
            {patient.profile.phone ? <Text style={styles.patientPhone}>{patient.profile.phone}</Text> : null}
          </Pressable>
        ))
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
    gap: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    height: 52,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
  row: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.default,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: 2,
  },
  patientName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold as any,
    color: theme.colors.text.primary,
  },
  patientPhone: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});
