import { ReactNode } from "react";
import clsx from "clsx";

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  accent?: "blue" | "green" | "amber" | "red" | "violet" | "teal";
  sub?: string;
}

const ACCENT = {
  blue:   "text-teal-700 dark:text-teal-300 bg-teal-600/10 border-teal-600/20",
  teal:   "text-teal-700 dark:text-teal-300 bg-teal-600/10 border-teal-600/20",
  green:  "text-emerald-700 dark:text-emerald-300 bg-emerald-600/10 border-emerald-600/20",
  amber:  "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-600/20",
  red:    "text-rose-700 dark:text-rose-300 bg-rose-600/10 border-rose-600/20",
  violet: "text-indigo-700 dark:text-indigo-300 bg-indigo-600/10 border-indigo-600/20",
};

export function KpiCard({ label, value, icon, accent = "blue", sub }: KpiCardProps) {
  return (
    <div className="rounded-lg border p-4 flex items-start gap-3" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
      <div className={clsx("rounded-md p-2 border", ACCENT[accent])}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
        <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{value}</p>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
      </div>
    </div>
  );
}
