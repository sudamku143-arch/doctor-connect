import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { Table } from "@/components/Table";
import { getClinicPerformance, getDoctorPerformance, getReportSummary } from "@/lib/api/reports";
import styles from "../shared.module.css";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const params = await searchParams;
  const defaults = defaultRange();
  const fromDate = params.from ?? defaults.from;
  const toDate = params.to ?? defaults.to;

  const [summary, doctorPerformance, clinicPerformance] = await Promise.all([
    getReportSummary(fromDate, toDate),
    getDoctorPerformance(fromDate, toDate),
    getClinicPerformance(fromDate, toDate),
  ]);

  return (
    <>
      <header>
        <h1 className={styles.title}>Reports</h1>
        <p className={styles.subtitle}>Daily/monthly figures for the selected range. CSV export is not available yet.</p>
      </header>

      <Card>
        <form className={styles.filterRow}>
          <input type="date" name="from" defaultValue={fromDate} className={styles.searchInput} />
          <input type="date" name="to" defaultValue={toDate} className={styles.searchInput} />
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
      </Card>

      <section className={styles.filterRow}>
        <StatCard label="Appointments" value={String(summary.totalAppointments)} />
        <StatCard label="Completed" value={String(summary.completedCount)} />
        <StatCard label="Cancellation Rate" value={`${summary.cancellationRate}%`} />
        <StatCard label="No-show Rate" value={`${summary.noShowRate}%`} />
        <StatCard label="Revenue" value={`₹${summary.revenue}`} />
      </section>

      <Card>
        <h2 className={styles.sectionTitle}>Doctor Performance</h2>
        <Table
          headers={["Doctor", "Total", "Completed", "Cancelled", "No-show"]}
          isEmpty={doctorPerformance.length === 0}
          emptyMessage="No appointments in this range."
        >
          {doctorPerformance.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.total}</td>
              <td>{row.completed}</td>
              <td>{row.cancelled}</td>
              <td>{row.noShow}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Clinic Performance</h2>
        <Table
          headers={["Clinic", "Total", "Completed", "Cancelled", "No-show"]}
          isEmpty={clinicPerformance.length === 0}
          emptyMessage="No appointments in this range."
        >
          {clinicPerformance.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.total}</td>
              <td>{row.completed}</td>
              <td>{row.cancelled}</td>
              <td>{row.noShow}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
