import { Card } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import styles from "./page.module.css";

// Static placeholders for Phase 1 — live queries land in Phase 4
// (Admin Panel backend wiring), per docs/ARCHITECTURE.md.
const STATS = [
  { label: "Total Doctors", value: "—" },
  { label: "Total Clinics", value: "—" },
  { label: "Total Patients", value: "—" },
  { label: "Today's Appointments", value: "—" },
  { label: "Total Bookings", value: "—" },
  { label: "Total Revenue", value: "—" },
];

export default function DashboardPage() {
  return (
    <>
      <header>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Overview across all clinics</p>
      </header>

      <section className={styles.statsGrid}>
        {STATS.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </section>

      <Card>
        <h2 className={styles.sectionTitle}>Recent appointments</h2>
        <p className={styles.emptyText}>No appointments yet.</p>
      </Card>
    </>
  );
}
