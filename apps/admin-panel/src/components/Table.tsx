import type { ReactNode } from "react";
import styles from "./Table.module.css";

interface TableProps {
  headers: string[];
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}

export function Table({ headers, isEmpty, emptyMessage, children }: TableProps) {
  if (isEmpty) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
