import { NewStaffForm } from "./NewStaffForm";
import { listClinics } from "@/lib/api/clinics";
import styles from "../../shared.module.css";

export default async function NewReceptionistPage() {
  const clinics = await listClinics();

  return (
    <>
      <header>
        <h1 className={styles.title}>Assign Staff</h1>
        <p className={styles.subtitle}>Find an already-registered user by email and assign them to a clinic.</p>
      </header>
      <NewStaffForm clinics={clinics} />
    </>
  );
}
