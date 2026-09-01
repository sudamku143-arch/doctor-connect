"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", enabled: true },
  { label: "Doctors", href: "/doctors", enabled: false },
  { label: "Clinics", href: "/clinics", enabled: false },
  { label: "Receptionists", href: "/receptionists", enabled: false },
  { label: "Patients", href: "/patients", enabled: false },
  { label: "Appointments", href: "/appointments", enabled: false },
  { label: "Payments", href: "/payments", enabled: false },
  { label: "Reviews", href: "/reviews", enabled: false },
  { label: "Notifications", href: "/notifications", enabled: false },
  { label: "Reports", href: "/reports", enabled: false },
  { label: "Settings", href: "/settings", enabled: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>Doctor Connect</div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) =>
          item.enabled ? (
            <Link
              key={item.href}
              href={item.href}
              className={[styles.link, pathname === item.href && styles.linkActive].filter(Boolean).join(" ")}
            >
              {item.label}
            </Link>
          ) : (
            <span key={item.href} className={styles.linkDisabled} title="Coming in a later phase">
              {item.label}
            </span>
          ),
        )}
      </nav>
    </aside>
  );
}
