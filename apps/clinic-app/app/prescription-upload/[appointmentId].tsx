import { useRef, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { captureRef } from "react-native-view-shot";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "@doctor-connect/theme";
import { ErrorState, PrimaryButton, SecondaryButton } from "@doctor-connect/ui-native";
import { WatermarkedImage } from "@/features/prescription/WatermarkedImage";
import { getClinicAppointmentDetails } from "@/lib/api/appointments";
import { uploadPrescription } from "@/lib/api/prescriptions";

export default function PrescriptionUploadScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const captureAreaRef = useRef<View>(null);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewWidth = screenWidth - theme.spacing.lg * 2;

  function setPickedImage(uri: string) {
    Image.getSize(
      uri,
      (naturalWidth, naturalHeight) => {
        const height = (previewWidth * naturalHeight) / naturalWidth;
        setImageSize({ width: previewWidth, height });
        setImageUri(uri);
      },
      () => setError("Could not read that image. Please try another."),
    );
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library permission is needed to pick a prescription image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
    if (!result.canceled && result.assets[0]) setPickedImage(result.assets[0].uri);
  }

  async function pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Camera permission is needed to photograph the prescription.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!result.canceled && result.assets[0]) setPickedImage(result.assets[0].uri);
  }

  async function handleUpload() {
    if (!appointmentId || !captureAreaRef.current) return;
    setUploading(true);
    setError(null);
    try {
      const appointment = await getClinicAppointmentDetails(appointmentId);
      if (!appointment) throw new Error("Appointment not found");

      const watermarkedImageDataUrl = await captureRef(captureAreaRef, { format: "png", quality: 1, result: "data-uri" });

      await uploadPrescription({
        appointmentId,
        doctorId: appointment.doctor_id,
        patientId: appointment.patient_id,
        clinicId: appointment.clinic_id,
        watermarkedImageDataUrl,
      });

      Alert.alert("Prescription uploaded", "The patient can now download it from their app.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      setError("Could not upload the prescription. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.lg }]}
    >
      <Text style={styles.title}>Upload Prescription</Text>
      <Text style={styles.subtitle}>
        Take a photo of, or pick, the handwritten/printed prescription. A “Doctor Connect” watermark is
        added automatically before it’s saved for the patient.
      </Text>

      {error ? <ErrorState title={error} /> : null}

      {imageUri && imageSize ? (
        <WatermarkedImage ref={captureAreaRef} imageUri={imageUri} width={imageSize.width} height={imageSize.height} />
      ) : (
        <View style={[styles.placeholder, { width: previewWidth }]}>
          <Text style={styles.placeholderText}>No image selected</Text>
        </View>
      )}

      <View style={styles.pickRow}>
        <SecondaryButton label="Take Photo" onPress={pickFromCamera} style={styles.pickButton} />
        <SecondaryButton label="Choose from Library" onPress={pickFromLibrary} style={styles.pickButton} />
      </View>

      <PrimaryButton
        label={imageUri ? "Generate & Upload Prescription" : "Select an image first"}
        onPress={handleUpload}
        loading={uploading}
        disabled={!imageUri || uploading}
      />
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
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  placeholder: {
    height: 220,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.colors.border.default,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  pickRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  pickButton: {
    flex: 1,
  },
});
