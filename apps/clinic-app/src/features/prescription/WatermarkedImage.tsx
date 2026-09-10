import { forwardRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const WATERMARK_TEXT = "Doctor Connect";
const GRID_ROWS = 6;
const GRID_COLS = 3;

// Renders the picked prescription photo with a tiled, semi-transparent,
// 45deg "Doctor Connect" watermark baked directly into the pixels (captured
// via view-shot into a PNG before it's wrapped in a PDF) — this is what
// makes the final PDF non-editable: there is no live text layer to select
// or strip out, only a flattened image.
export const WatermarkedImage = forwardRef<View, { imageUri: string; width: number; height: number }>(
  ({ imageUri, width, height }, ref) => {
    return (
      <View ref={ref} collapsable={false} style={[styles.container, { width, height }]}>
        <Image source={{ uri: imageUri }} style={[styles.image, { width, height }]} resizeMode="contain" />
        <View style={styles.watermarkLayer} pointerEvents="none">
          {Array.from({ length: GRID_ROWS }, (_, row) => (
            <View key={row} style={styles.watermarkRow}>
              {Array.from({ length: GRID_COLS }, (_, col) => (
                <Text key={col} style={styles.watermarkText}>
                  {WATERMARK_TEXT}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  },
);
WatermarkedImage.displayName = "WatermarkedImage";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  watermarkLayer: {
    position: "absolute",
    top: "-20%",
    left: "-20%",
    width: "140%",
    height: "140%",
    justifyContent: "space-evenly",
    transform: [{ rotate: "-30deg" }],
  },
  watermarkRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  watermarkText: {
    fontSize: 22,
    fontWeight: "700",
    color: "rgba(60, 60, 60, 0.18)",
  },
});
