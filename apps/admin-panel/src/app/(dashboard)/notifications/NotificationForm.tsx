"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { Select } from "@/components/Select";
import { sendNotificationAction } from "./actions";
import type { ActionState } from "../doctors/actions";
import type { Clinic } from "@doctor-connect/types";
import styles from "../shared.module.css";

export function NotificationForm({ clinics }: { clinics: Clinic[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(sendNotificationAction, {});
  const [targetType, setTargetType] = useState("ALL_PATIENTS");

  return (
    <Card>
      <form action={formAction} className={styles.formGrid}>
        <Select label="Send to" name="targetType" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
          <option value="ALL_PATIENTS">All Patients (System notification)</option>
          <option value="CLINIC_STAFF">A Clinic&apos;s Staff</option>
          <option value="PATIENT">A Specific Patient</option>
        </Select>

        {targetType === "PATIENT" ? <TextField label="Patient's email" name="patientEmail" type="email" required /> : null}

        {targetType === "CLINIC_STAFF" ? (
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
        ) : null}

        <TextField label="Title" name="title" required />
        <TextField label="Message" name="body" required />

        {state.error ? <p className={styles.error}>{state.error}</p> : null}
        <Button type="submit" loading={pending}>
          Send Notification
        </Button>
      </form>
    </Card>
  );
}
