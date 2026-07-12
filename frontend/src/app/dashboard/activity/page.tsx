"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar, Select } from "@/components/ui/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Bell, Activity, CheckCheck } from "lucide-react";

// TODO: map to backend API
const MOCK_NOTIFICATIONS = [
  { id: "1", type: "OVERDUE",      title: "Overdue Return",          message: "Dell XPS 15 (AST-001) was due back on Jan 1. John Doe has not returned it.", time: "2 hr ago",  read: false },
  { id: "2", type: "MAINTENANCE",  title: "Maintenance Approved",    message: "Request MNT-003 for Dell XPS 15 has been approved and assigned to Dave Tech.", time: "3 hr ago",  read: false },
  { id: "3", type: "TRANSFER",     title: "Transfer Request",        message: "Sarah Kim requested transfer of HP LaserJet from Operations to Finance.", time: "5 hr ago",  read: true },
  { id: "4", type: "BOOKING",      title: "Booking Confirmed",       message: "Conference Room A is confirmed for Sprint Planning on Jan 22, 9–11am.", time: "6 hr ago",  read: true },
  { id: "5", type: "AUDIT",        title: "Audit Discrepancy Found", message: "Cisco Switch (AST-004) location mismatch found during Q1 2025 audit.", time: "1 day ago", read: true },
  { id: "6", type: "ALLOCATION",   title: "Asset Allocated",         message: "MacBook Pro M3 (AST-005) allocated to Jane Smith by Admin.", time: "1 day ago", read: true },
];

const MOCK_LOGS = [
  { id: "1", action: "ALLOCATED",     entity: "AssetAllocation", entityId: "alloc-001", actor: "Admin",      time: "2025-01-22 09:15", reason: "Standard allocation" },
  { id: "2", action: "APPROVED",      entity: "MaintenanceRequest", entityId: "mnt-003", actor: "Manager",   time: "2025-01-22 08:30", reason: "Maintenance approved" },
  { id: "3", action: "CREATED",       entity: "Asset",           entityId: "ast-010",   actor: "Admin",      time: "2025-01-21 16:00", reason: "Initial asset registration" },
  { id: "4", action: "STATUS_CHANGED",entity: "Asset",           entityId: "ast-004",   actor: "System",     time: "2025-01-21 14:20", reason: "Asset moved to maintenance" },
  { id: "5", action: "RETURNED",      entity: "AssetAllocation", entityId: "alloc-009", actor: "Lisa Park",  time: "2025-01-21 11:00", reason: "Asset returned" },
  { id: "6", action: "CREATED",       entity: "TransferRequest", entityId: "trf-004",   actor: "Bob Smith",  time: "2025-01-20 15:45", reason: "Transfer requested" },
];

const TYPE_OPTS = [
  { value: "", label: "All Types" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "BOOKING", label: "Booking" },
  { value: "AUDIT", label: "Audit" },
  { value: "ALLOCATION", label: "Allocation" },
];

const TYPE_COLORS: Record<string, string> = {
  OVERDUE:     "var(--danger)",
  MAINTENANCE: "var(--warning)",
  TRANSFER:    "var(--info)",
  BOOKING:     "var(--accent)",
  AUDIT:       "var(--danger)",
  ALLOCATION:  "var(--success)",
};

export default function ActivityPage() {
  const [tab, setTab] = useState<"notifications" | "logs">("notifications");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredNotifs = MOCK_NOTIFICATIONS.filter((n) =>
    (!search || n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase()))
    && (!typeFilter || n.type === typeFilter)
  );

  const filteredLogs = MOCK_LOGS.filter((l) =>
    !search || l.action.toLowerCase().includes(search.toLowerCase()) || l.entity.toLowerCase().includes(search.toLowerCase()) || l.actor.toLowerCase().includes(search.toLowerCase())
  );

  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  const TAB_CLS = (t: string) =>
    `px-3 py-1.5 text-[12px] rounded transition-colors ${tab === t ? "bg-blue-600/20 text-blue-400 font-medium" : "hover:bg-white/5"}`;

  return (
    <div>
      <PageHeader
        title="Activity & Notifications"
        subtitle="System events, alerts, and audit trail"
        actions={
          unread > 0 ? (
            <button className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded border hover:opacity-80" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              <CheckCheck size={12} />
              Mark all read
            </button>
          ) : null
        }
      />

      <div className="flex gap-1 mb-4 p-1 rounded-lg w-fit" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <button className={TAB_CLS("notifications")} style={tab !== "notifications" ? { color: "var(--text-secondary)" } : {}} onClick={() => setTab("notifications")}>
          <Bell size={12} className="inline mr-1.5" />
          Notifications
          {unread > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-600 text-white">{unread}</span>}
        </button>
        <button className={TAB_CLS("logs")} style={tab !== "logs" ? { color: "var(--text-secondary)" } : {}} onClick={() => setTab("logs")}>
          <Activity size={12} className="inline mr-1.5" />
          Activity Log
        </button>
      </div>

      <FilterBar search={search} onSearch={setSearch} placeholder={tab === "notifications" ? "Search notifications…" : "Search logs…"}>
        {tab === "notifications" && <Select value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTS} />}
      </FilterBar>

      {tab === "notifications" && (
        <div className="space-y-1.5">
          {filteredNotifs.length === 0 ? (
            <div className="py-12 text-center text-[12px]" style={{ color: "var(--text-muted)" }}>No notifications.</div>
          ) : filteredNotifs.map((n) => (
            <div
              key={n.id}
              className="rounded-lg border p-3.5 flex items-start gap-3 transition-colors"
              style={{
                background: n.read ? "var(--bg-surface)" : "var(--bg-elevated)",
                borderColor: n.read ? "var(--border)" : "var(--accent)",
                borderLeftWidth: n.read ? "1px" : "3px",
              }}
            >
              <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: TYPE_COLORS[n.type] ?? "var(--text-muted)" }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{n.title}</p>
                  <span className="text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>{n.time}</span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{n.message}</p>
              </div>
              {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
            </div>
          ))}
        </div>
      )}

      {tab === "logs" && (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                {["Action", "Entity", "Entity ID", "Actor", "Timestamp", "Reason"].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 font-semibold" style={{ color: "var(--text-secondary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((l, i) => (
                <tr key={l.id} className="border-t" style={{ borderColor: "var(--border-subtle)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)" }}>
                  <td className="px-3 py-2.5"><StatusBadge status={l.action} /></td>
                  <td className="px-3 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{l.entity}</td>
                  <td className="px-3 py-2.5 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>{l.entityId}</td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{l.actor}</td>
                  <td className="px-3 py-2.5 font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>{l.time}</td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-muted)" }}>{l.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
