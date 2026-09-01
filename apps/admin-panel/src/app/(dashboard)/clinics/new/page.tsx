"use client";

import { useActionState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { createClinicAction } from "../actions";
import type { ActionState } from "../../doctors/actions";
import styles from "../../shared.module.css";

export default function NewClinicPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createClinicAction, {});

  return (
    <>
      <header>
        <h1 className={styles.title}>Add Clinic</h1>
        <p className={styles.subtitle}>There is no clinic self-registration flow in V1 — clinics are onboarded here.</p>
      </header>

      <Card>
        <form action={formAction} className={styles.formGrid}>
          <TextField label="Clinic name" name="name" required />
          <TextField label="Address" name="address" required />
          <TextField label="City" name="city" required />
          <TextField label="Phone" name="phone" />
          {state.error ? <p className={styles.error}>{state.error}</p> : null}
          <Button type="submit" loading={pending}>
            Create Clinic
          </Button>
        </form>
      </Card>
    </>
  );
}
