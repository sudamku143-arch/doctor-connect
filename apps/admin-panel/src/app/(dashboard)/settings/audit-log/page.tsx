import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { listAuditLogs } from "@/lib/api/audit";
import styles from "../../shared.module.css";

export default async function AuditLogPage() {
  const logs = await listAuditLogs();

  return (
    <>
      <header>
        <h1 className={styles.title}>Audit Log</h1>
        <p className={styles.subtitle}>Access/status-changing admin actions — verification, staff, cancellations, notifications.</p>
      </header>

      <Card>
        <Table
          headers={["When", "Admin", "Action", "Entity", "Details"]}
          isEmpty={logs.length === 0}
          emptyMessage="No admin actions logged yet."
        >
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.created_at).toLocaleString()}</td>
              <td>{log.actor?.full_name ?? "—"}</td>
              <td>{log.action}</td>
              <td>
                {log.entity_type} · {log.entity_id.slice(0, 8)}
              </td>
              <td>{log.after ? JSON.stringify(log.after) : "—"}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
