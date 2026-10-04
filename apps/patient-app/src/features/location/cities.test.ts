import { describe, expect, it } from "@jest/globals";
import { canonicalCityName, distanceKm, nearestClinicCity, resolveGpsCity } from "./cities";

const BERHAMPUR_CLINIC = { city: "Berhampur", latitude: 19.3149, longitude: 84.7941 };

describe("canonicalCityName", () => {
  it("matches a served city case-insensitively", () => {
    expect(canonicalCityName("  berhampur ", ["Berhampur"])).toBe("Berhampur");
  });

  it("maps official/alternate names to the listed name", () => {
    expect(canonicalCityName("Brahmapur", ["Berhampur"])).toBe("Berhampur");
    expect(canonicalCityName("Vizag", [])).toBe("Visakhapatnam");
  });

  it("passes unknown names through trimmed", () => {
    expect(canonicalCityName(" Hyderabad ", ["Berhampur"])).toBe("Hyderabad");
  });
});

describe("distanceKm", () => {
  it("is roughly right for Berhampur to Bhubaneswar (~150 km)", () => {
    const km = distanceKm(19.3149, 84.7941, 20.2961, 85.8245);
    expect(km).toBeGreaterThan(140);
    expect(km).toBeLessThan(160);
  });
});

describe("nearestClinicCity", () => {
  it("returns the nearest clinic city within range", () => {
    expect(nearestClinicCity(19.33, 84.8, [BERHAMPUR_CLINIC])).toBe("Berhampur");
  });

  it("returns null when every clinic is out of range", () => {
    expect(nearestClinicCity(20.2961, 85.8245, [BERHAMPUR_CLINIC])).toBeNull();
  });
});

describe("resolveGpsCity", () => {
  const nearBerhampur = { latitude: 19.33, longitude: 84.8 };

  it("prefers a geocoded name that is a served city (via alias)", () => {
    expect(resolveGpsCity(["Brahmapur"], ["Berhampur"], nearBerhampur, [])).toBe("Berhampur");
  });

  it("falls back to the nearest clinic's city for an unknown locality", () => {
    expect(resolveGpsCity(["Gopalpur"], ["Berhampur"], nearBerhampur, [BERHAMPUR_CLINIC])).toBe("Berhampur");
  });

  it("returns the geocoded name when nothing we serve is nearby", () => {
    expect(resolveGpsCity([null, "Hyderabad"], ["Berhampur"], { latitude: 17.385, longitude: 78.4867 }, [BERHAMPUR_CLINIC])).toBe(
      "Hyderabad",
    );
  });

  it("returns null when geocoding gave nothing and no clinic is near", () => {
    expect(resolveGpsCity([undefined, ""], ["Berhampur"], { latitude: 17.385, longitude: 78.4867 }, [])).toBeNull();
  });
});
