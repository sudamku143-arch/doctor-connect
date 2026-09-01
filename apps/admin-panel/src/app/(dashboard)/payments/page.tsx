import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { listPayments } from "@/lib/api/payments";
import styles from "../shared.module.css";

export default async function PaymentsPage() {
  const payments = await listPayments();

  return (
    <>
      <header>
        <h1 className={styles.title}>Payments</h1>
        <p className={styles.subtitle}>Razorpay is not integrated yet (Phase 6) — this will be empty until then.</p>
      </header>

      <Card>
        <Table
          headers={["Patient", "Clinic", "Amount", "Platform Fee", "Clinic Amount", "Status", "Date"]}
          isEmpty={payments.length === 0}
          emptyMessage="No payments yet."
        >
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.appointment?.patient?.profile?.full_name ?? "—"}</td>
              <td>{payment.appointment?.clinic.name ?? "—"}</td>
              <td>₹{payment.amount}</td>
              <td>₹{payment.platform_fee}</td>
              <td>₹{payment.clinic_amount}</td>
              <td>{payment.status}</td>
              <td>{new Date(payment.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
