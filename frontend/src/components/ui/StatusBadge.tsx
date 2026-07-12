import clsx from "clsx";

const VARIANTS: Record<string, string> = {
  // Asset status
  AVAILABLE:       "bg-emerald-900/40 text-emerald-400 border-emerald-800",
  ALLOCATED:       "bg-blue-900/40 text-blue-400 border-blue-800",
  UNDER_MAINTENANCE:"bg-amber-900/40 text-amber-400 border-amber-800",
  RESERVED:        "bg-violet-900/40 text-violet-400 border-violet-800",
  LOST:            "bg-red-900/40 text-red-400 border-red-800",
  RETIRED:         "bg-zinc-800 text-zinc-400 border-zinc-700",
  DISPOSED:        "bg-zinc-800 text-zinc-500 border-zinc-700",
  // Allocation / Transfer
  ACTIVE:          "bg-blue-900/40 text-blue-400 border-blue-800",
  RETURNED:        "bg-emerald-900/40 text-emerald-400 border-emerald-800",
  REQUESTED:       "bg-amber-900/40 text-amber-400 border-amber-800",
  APPROVED:        "bg-emerald-900/40 text-emerald-400 border-emerald-800",
  REJECTED:        "bg-red-900/40 text-red-400 border-red-800",
  COMPLETED:       "bg-emerald-900/40 text-emerald-400 border-emerald-800",
  CANCELLED:       "bg-zinc-800 text-zinc-400 border-zinc-700",
  // Booking
  HELD:            "bg-amber-900/40 text-amber-400 border-amber-800",
  CONFIRMED:       "bg-blue-900/40 text-blue-400 border-blue-800",
  CHECKED_IN:      "bg-violet-900/40 text-violet-400 border-violet-800",
  EXPIRED:         "bg-zinc-800 text-zinc-400 border-zinc-700",
  // Maintenance
  PENDING:         "bg-amber-900/40 text-amber-400 border-amber-800",
  ASSIGNED:        "bg-blue-900/40 text-blue-400 border-blue-800",
  IN_REPAIR:       "bg-violet-900/40 text-violet-400 border-violet-800",
  RESOLVED:        "bg-emerald-900/40 text-emerald-400 border-emerald-800",
  // Audit
  OPEN:            "bg-blue-900/40 text-blue-400 border-blue-800",
  IN_PROGRESS:     "bg-violet-900/40 text-violet-400 border-violet-800",
  CLOSED:          "bg-zinc-800 text-zinc-400 border-zinc-700",
  DISCREPANCY:     "bg-red-900/40 text-red-400 border-red-800",
  MATCHED:         "bg-emerald-900/40 text-emerald-400 border-emerald-800",
  // Priority
  LOW:             "bg-zinc-800 text-zinc-400 border-zinc-700",
  MEDIUM:          "bg-amber-900/40 text-amber-400 border-amber-800",
  HIGH:            "bg-orange-900/40 text-orange-400 border-orange-800",
  CRITICAL:        "bg-red-900/40 text-red-400 border-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = VARIANTS[status] ?? "bg-zinc-800 text-zinc-400 border-zinc-700";
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border", cls)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
