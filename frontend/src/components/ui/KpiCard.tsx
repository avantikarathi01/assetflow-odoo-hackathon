import { ReactNode } from "react";
import clsx from "clsx";

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  accent?: "blue" | "green" | "amber" | "red" | "violet";
  sub?: string;
}

const ACCENT = {
  blue:   "text-blue-400 bg-blue-900/20 border-blue-900",
  green:  "text-emerald-400 bg-emerald-900/20 border-emerald-900",
  amber:  "text-amber-400 bg-amber-900/20 border-amber-900",
  red:    "text-red-400 bg-red-900/20 border-red-900",
  violet: "text-violet-400 bg-violet-900/20 border-violet-900",
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
