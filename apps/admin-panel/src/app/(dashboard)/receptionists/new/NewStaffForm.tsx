"use client";

import { useActionState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { Select } from "@/components/Select";
import { assignStaffAction } from "../actions";
import type { ActionState } from "../../doctors/actions";
import type { Clinic } from "@doctor-connect/types";
import styles from "../../shared.module.css";

export function NewStaffForm({ clinics }: { clinics: Clinic[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(assignStaffAction, {});

  return (
    <Card>
      <form action={formAction} className={styles.formGrid}>
        <TextField label="User's email" name="email" type="email" required />
        <Select label="Clinic" name="clinicId" required defaultValue="">
          <option value="" disabled>
            Select a clinic…
          </option>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </Select>
        <Select label="Role" name="role" defaultValue="RECEPTIONIST">
          <option value="RECEPTIONIST">Receptionist</option>
          <option value="CLINIC_ADMIN">Clinic Admin</option>
        </Select>
        {state.error ? <p className={styles.error}>{state.error}</p> : null}
        <Button type="submit" loading={pending}>
          Assign
        </Button>
      </form>
    </Card>
  );
}
