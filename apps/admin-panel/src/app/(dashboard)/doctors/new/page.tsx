"use client";

import { useActionState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Select } from "@/components/Select";
import { TextField } from "@/components/TextField";
import { createDoctorAction, type ActionState } from "../actions";
import styles from "../../shared.module.css";

export default function NewDoctorPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createDoctorAction, {});

  return (
    <>
      <header>
        <h1 className={styles.title}>Add Doctor</h1>
        <p className={styles.subtitle}>
          There is no doctor-facing app in V1 — this is how a doctor&apos;s profile gets created before admin verification.
        </p>
      </header>

      <Card>
        <form action={formAction} className={styles.formGrid}>
          <TextField label="Full name" name="fullName" required />
          <TextField label="Qualification" name="qualification" placeholder="MBBS, MD (General Medicine)" required />
          <TextField label="Registration number" name="registrationNumber" required />
          <TextField label="Experience (years)" name="experienceYears" type="number" min={0} defaultValue={0} />
          <TextField label="Bio (optional)" name="bio" />
          <Select label="Consultation Options" name="consultationMode" defaultValue="BOTH">
            <option value="BOTH">Both Physical & Video</option>
            <option value="PHYSICAL_ONLY">Physical Only</option>
          </Select>
          {state.error ? <p className={styles.error}>{state.error}</p> : null}
          <Button type="submit" loading={pending}>
            Create Doctor
          </Button>
        </form>
      </Card>
    </>
  );
}
