import { describe, expect, it } from "@jest/globals";
import { getSpecialtyIcon } from "./specialtyIcons";

describe("getSpecialtyIcon", () => {
  it("maps a known DB icon value to its Ionicons glyph", () => {
    expect(getSpecialtyIcon("stethoscope")).toBe("medkit");
    expect(getSpecialtyIcon("heart")).toBe("heart");
  });

  it("falls back to a generic icon for an unknown value", () => {
    expect(getSpecialtyIcon("some-future-specialty-icon")).toBe("medical-outline");
  });

  it("falls back to a generic icon for null", () => {
    expect(getSpecialtyIcon(null)).toBe("medical-outline");
  });
});
