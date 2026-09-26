import { describe, expect, it } from "@jest/globals";
import { getSpecialtyIcon } from "./specialtyIcons";

describe("getSpecialtyIcon", () => {
  it("maps a known DB icon value to its MaterialCommunityIcons glyph", () => {
    expect(getSpecialtyIcon("stethoscope")).toBe("stethoscope");
    expect(getSpecialtyIcon("heart")).toBe("heart-pulse");
  });

  it("falls back to a generic icon for an unknown value", () => {
    expect(getSpecialtyIcon("some-future-specialty-icon")).toBe("medical-bag");
  });

  it("falls back to a generic icon for null", () => {
    expect(getSpecialtyIcon(null)).toBe("medical-bag");
  });
});
