"use client";

import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
}

export function Button({ variant = "primary", loading = false, disabled, children, className, ...rest }: ButtonProps) {
  return (
    <button
      className={[styles.base, styles[variant], className].filter(Boolean).join(" ")}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "..." : children}
    </button>
  );
}
