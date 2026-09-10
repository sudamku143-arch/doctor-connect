import { z } from "zod";

const mobile = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");

const age = z
  .string()
  .trim()
  .min(1, "This field is required")
  .regex(/^\d+$/, "Age must be a number")
  .refine((v) => Number(v) >= 0 && Number(v) <= 120, "Enter an age between 0 and 120");

export const patientDetailsSchema = z.object({
  name: z.string().trim().min(2, "This field is required"),
  age,
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { errorMap: () => ({ message: "Please select gender." }) }),
  mobile,
  relation: z.string().trim().optional(),
  reasonForVisit: z.string().trim().max(500).optional(),
});
export type PatientDetailsInput = z.infer<typeof patientDetailsSchema>;

export const familyMemberSchema = z.object({
  name: z.string().trim().min(2, "Enter their name"),
  relation: z.string().trim().min(1, "Enter their relation to you (e.g. Spouse, Child)"),
  dateOfBirth: z.string().trim().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
});
export type FamilyMemberInput = z.infer<typeof familyMemberSchema>;
