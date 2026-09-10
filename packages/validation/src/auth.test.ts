import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, loginSchema, signupSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts a valid email + non-empty password", () => {
    const result = loginSchema.safeParse({ email: "patient@example.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "anything" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "patient@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  const valid = {
    fullName: "Jane Doe",
    email: "patient@example.com",
    phone: "9876543210",
    password: "password1",
    confirmPassword: "password1",
    acceptedTerms: true as const,
  };

  it("accepts a fully valid signup", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a phone number not starting with 6-9", () => {
    const result = signupSchema.safeParse({ ...valid, phone: "1234567890" });
    expect(result.success).toBe(false);
  });

  it("rejects a phone number with the wrong length", () => {
    const result = signupSchema.safeParse({ ...valid, phone: "98765" });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no digit", () => {
    const result = signupSchema.safeParse({ ...valid, password: "onlyletters", confirmPassword: "onlyletters" });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no letter", () => {
    const result = signupSchema.safeParse({ ...valid, password: "12345678", confirmPassword: "12345678" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signupSchema.safeParse({ ...valid, password: "abc123", confirmPassword: "abc123" });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({ ...valid, confirmPassword: "different1" });
    expect(result.success).toBe(false);
  });

  it("rejects when terms are not accepted", () => {
    const result = signupSchema.safeParse({ ...valid, acceptedTerms: false });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "patient@example.com" }).success).toBe(true);
  });

  it("rejects an empty email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
  });
});
