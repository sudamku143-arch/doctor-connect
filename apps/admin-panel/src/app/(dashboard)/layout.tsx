import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import styles from "./layout.module.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
