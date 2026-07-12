import clsx from "clsx";

const VARIANTS: Record<string, string> = {
  // Asset status
  AVAILABLE:       "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/20",
  ALLOCATED:       "bg-teal-600/10 text-teal-700 dark:text-teal-300 border-teal-600/20",
  UNDER_MAINTENANCE:"bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-600/20",
  RESERVED:        "bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-600/20",
  LOST:            "bg-rose-600/10 text-rose-700 dark:text-rose-300 border-rose-600/20",
  RETIRED:         "bg-slate-600/10 text-slate-600 dark:text-slate-300 border-slate-600/20",
  DISPOSED:        "bg-slate-600/10 text-slate-500 dark:text-slate-400 border-slate-600/20",
  // Allocation / Transfer
  ACTIVE:          "bg-teal-600/10 text-teal-700 dark:text-teal-300 border-teal-600/20",
  RETURNED:        "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/20",
  REQUESTED:       "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-600/20",
  APPROVED:        "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/20",
  REJECTED:        "bg-rose-600/10 text-rose-700 dark:text-rose-300 border-rose-600/20",
  COMPLETED:       "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/20",
  CANCELLED:       "bg-slate-600/10 text-slate-600 dark:text-slate-300 border-slate-600/20",
  // Booking
  HELD:            "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-600/20",
  CONFIRMED:       "bg-teal-600/10 text-teal-700 dark:text-teal-300 border-teal-600/20",
  CHECKED_IN:      "bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-600/20",
  EXPIRED:         "bg-slate-600/10 text-slate-600 dark:text-slate-300 border-slate-600/20",
  // Maintenance
  PENDING:         "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-600/20",
  ASSIGNED:        "bg-teal-600/10 text-teal-700 dark:text-teal-300 border-teal-600/20",
  IN_REPAIR:       "bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-600/20",
  RESOLVED:        "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/20",
  // Audit
  OPEN:            "bg-teal-600/10 text-teal-700 dark:text-teal-300 border-teal-600/20",
  IN_PROGRESS:     "bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-600/20",
  CLOSED:          "bg-slate-600/10 text-slate-600 dark:text-slate-300 border-slate-600/20",
  DISCREPANCY:     "bg-rose-600/10 text-rose-700 dark:text-rose-300 border-rose-600/20",
  MATCHED:         "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/20",
  // Priority
  LOW:             "bg-slate-600/10 text-slate-600 dark:text-slate-300 border-slate-600/20",
  MEDIUM:          "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-600/20",
  HIGH:            "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-600/20",
  CRITICAL:        "bg-rose-600/10 text-rose-700 dark:text-rose-300 border-rose-600/20",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = VARIANTS[status] ?? "bg-slate-600/10 text-slate-600 dark:text-slate-300 border-slate-600/20";
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border", cls)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
