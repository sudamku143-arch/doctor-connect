import { z } from "zod";

const mobile = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");

export const patientDetailsSchema = z.object({
  name: z.string().trim().min(2, "Enter the patient's name"),
  dateOfBirth: z.string().trim().min(1, "Enter a date of birth"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { errorMap: () => ({ message: "Select a gender" }) }),
  mobile,
  reasonForVisit: z.string().trim().min(1, "Enter a reason for the visit").max(500),
});
export type PatientDetailsInput = z.infer<typeof patientDetailsSchema>;

export const familyMemberSchema = z.object({
  name: z.string().trim().min(2, "Enter their name"),
  relation: z.string().trim().min(1, "Enter their relation to you (e.g. Spouse, Child)"),
  dateOfBirth: z.string().trim().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
});
export type FamilyMemberInput = z.infer<typeof familyMemberSchema>;
