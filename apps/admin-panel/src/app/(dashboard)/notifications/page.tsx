import { listClinics } from "@/lib/api/clinics";
import { NotificationForm } from "./NotificationForm";
import styles from "../shared.module.css";

export default async function NotificationsPage() {
  const clinics = await listClinics();

  return (
    <>
      <header>
        <h1 className={styles.title}>Notifications</h1>
        <p className={styles.subtitle}>Send a system, clinic, or patient notification.</p>
      </header>
      <NotificationForm clinics={clinics} />
    </>
  );
}
