import { describe, expect, it } from "vitest";
import { familyMemberSchema, patientDetailsSchema } from "./patientDetails";

describe("patientDetailsSchema", () => {
  const valid = {
    name: "Ramesh Kumar",
    age: "34",
    gender: "MALE" as const,
    mobile: "9876543210",
    reasonForVisit: "Fever",
  };

  it("accepts fully valid patient details", () => {
    expect(patientDetailsSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts patient details with no reason for visit (optional)", () => {
    expect(patientDetailsSchema.safeParse({ ...valid, reasonForVisit: undefined }).success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(patientDetailsSchema.safeParse({ ...valid, name: "R" }).success).toBe(false);
  });

  it("rejects a missing age", () => {
    expect(patientDetailsSchema.safeParse({ ...valid, age: "" }).success).toBe(false);
  });

  it("rejects a non-numeric age", () => {
    expect(patientDetailsSchema.safeParse({ ...valid, age: "abc" }).success).toBe(false);
  });

  it("rejects an age over 120", () => {
    expect(patientDetailsSchema.safeParse({ ...valid, age: "121" }).success).toBe(false);
  });

  it("rejects a missing gender", () => {
    expect(patientDetailsSchema.safeParse({ ...valid, gender: undefined }).success).toBe(false);
  });

  it("rejects an invalid gender", () => {
    expect(patientDetailsSchema.safeParse({ ...valid, gender: "OTHER_INVALID" }).success).toBe(false);
  });

  it("rejects a mobile number not starting with 6-9", () => {
    expect(patientDetailsSchema.safeParse({ ...valid, mobile: "1234567890" }).success).toBe(false);
  });

  it("rejects a reason for visit over 500 characters", () => {
    expect(patientDetailsSchema.safeParse({ ...valid, reasonForVisit: "a".repeat(501) }).success).toBe(false);
  });
});

describe("familyMemberSchema", () => {
  it("accepts name + relation only (dateOfBirth/gender optional)", () => {
    expect(familyMemberSchema.safeParse({ name: "Sita Kumar", relation: "Spouse" }).success).toBe(true);
  });

  it("rejects a missing relation", () => {
    expect(familyMemberSchema.safeParse({ name: "Sita Kumar", relation: "" }).success).toBe(false);
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(familyMemberSchema.safeParse({ name: "S", relation: "Spouse" }).success).toBe(false);
  });
});
