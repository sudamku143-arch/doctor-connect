"use client";

import { useActionState } from "react";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { TextField } from "@/components/TextField";
import { updateDoctorAction, type ActionState } from "../actions";
import type { Doctor } from "@doctor-connect/types";
import styles from "../../shared.module.css";

export function EditForm({ doctor }: { doctor: Doctor }) {
  const action = updateDoctorAction.bind(null, doctor.id);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className={styles.formGrid}>
      <TextField label="Full name" name="fullName" defaultValue={doctor.full_name} required />
      <TextField label="Qualification" name="qualification" defaultValue={doctor.qualification} required />
      <TextField label="Experience (years)" name="experienceYears" type="number" min={0} defaultValue={doctor.experience_years} />
      <TextField label="Bio" name="bio" defaultValue={doctor.bio ?? ""} />
      <Select label="Consultation Options" name="consultationMode" defaultValue={doctor.consultation_mode}>
        <option value="BOTH">Both Physical & Video</option>
        <option value="PHYSICAL_ONLY">Physical Only</option>
      </Select>
      {state.error ? <p className={styles.error}>{state.error}</p> : null}
      <Button type="submit" loading={pending}>
        Save Changes
      </Button>
    </form>
  );
}
