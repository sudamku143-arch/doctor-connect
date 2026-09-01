"use client";

import { useActionState } from "react";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { updateClinicAction } from "../actions";
import type { ActionState } from "../../doctors/actions";
import type { Clinic } from "@doctor-connect/types";
import styles from "../../shared.module.css";

export function EditForm({ clinic }: { clinic: Clinic }) {
  const action = updateClinicAction.bind(null, clinic.id);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className={styles.formGrid}>
      <TextField label="Clinic name" name="name" defaultValue={clinic.name} required />
      <TextField label="Address" name="address" defaultValue={clinic.address} required />
      <TextField label="City" name="city" defaultValue={clinic.city} required />
      <TextField label="Phone" name="phone" defaultValue={clinic.phone ?? ""} />
      {state.error ? <p className={styles.error}>{state.error}</p> : null}
      <Button type="submit" loading={pending}>
        Save Changes
      </Button>
    </form>
  );
}
