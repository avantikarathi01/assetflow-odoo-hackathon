"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar } from "@/components/ui/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal, FormField, Input, Textarea, SelectField, Btn } from "@/components/ui/Modal";
import { ChevronRight, Plus } from "lucide-react";

// TODO: map to backend API
const MOCK_CYCLES = [
  { id: "1", name: "Q1 2025 Full Audit",    scope: "All Assets",       startDate: "2025-01-01", endDate: "2025-03-31", status: "IN_PROGRESS", total: 142, verified: 98,  discrepancies: 3 },
  { id: "2", name: "IT Equipment Spot Check",scope: "IT Department",   startDate: "2024-12-01", endDate: "2024-12-15", status: "CLOSED",      total: 45,  verified: 45,  discrepancies: 1 },
  { id: "3", name: "Warehouse Inventory",    scope: "Warehouse A",     startDate: "2025-02-01", endDate: "2025-02-28", status: "OPEN",        total: 67,  verified: 0,   discrepancies: 0 },
];

const MOCK_RECORDS = [
  { id: "1", cycleId: "1", assetTag: "AST-001", assetName: "Dell XPS 15",    auditor: "Alice Wong", auditedAt: "2025-01-10", outcome: "MATCHED",     notes: "" },
  { id: "2", cycleId: "1", assetTag: "AST-004", assetName: "Cisco Switch",   auditor: "Alice Wong", auditedAt: "2025-01-11", outcome: "DISCREPANCY", notes: "Location mismatch — found in Floor 2 not Server Room" },
  { id: "3", cycleId: "1", assetTag: "AST-007", assetName: "Epson Projector",auditor: "Bob Smith",  auditedAt: "2025-01-12", outcome: "MATCHED",     notes: "" },
];

export default function AuditPage() {
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", scope: "", startDate: "", endDate: "" });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const cycle = MOCK_CYCLES.find((c) => c.id === selectedCycle);
  const records = MOCK_RECORDS.filter((r) => r.cycleId === selectedCycle && (!search || r.assetName.toLowerCase().includes(search.toLowerCase())));

  return (
    <div>
      <PageHeader
        title="Asset Audit"
        subtitle="Manage audit cycles and verify asset records"
        actions={<Btn onClick={() => setModal(true)}><Plus size={12} className="inline mr-1" />New Audit Cycle</Btn>}
      />

      {!selectedCycle ? (
        /* Cycle List */
        <div className="space-y-2">
          {MOCK_CYCLES.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border p-4 flex items-center justify-between cursor-pointer transition-colors"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
              onClick={() => setSelectedCycle(c.id)}
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{c.scope} · {c.startDate} → {c.endDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{c.verified}/{c.total} verified</p>
                  {c.discrepancies > 0 && (
                    <p className="text-[11px] text-red-400">{c.discrepancies} discrepanc{c.discrepancies > 1 ? "ies" : "y"}</p>
                  )}
                </div>
                {/* Progress bar */}
                <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.round((c.verified / Math.max(c.total, 1)) * 100)}%` }} />
                </div>
                <StatusBadge status={c.status} />
                <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Cycle Detail */
        <div>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setSelectedCycle(null)} className="text-[12px] hover:underline" style={{ color: "var(--text-secondary)" }}>
              ← All Cycles
            </button>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <span className="text-[12px]" style={{ color: "var(--text-primary)" }}>{cycle?.name}</span>
            <StatusBadge status={cycle?.status ?? ""} />
          </div>

          {/* Cycle stats */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: "Total Assets", value: cycle?.total },
              { label: "Verified",     value: cycle?.verified },
              { label: "Pending",      value: (cycle?.total ?? 0) - (cycle?.verified ?? 0) },
              { label: "Discrepancies",value: cycle?.discrepancies },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border p-3" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{label}</p>
                <p className="text-xl font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{value}</p>
              </div>
            ))}
          </div>

          <FilterBar search={search} onSearch={setSearch} placeholder="Search assets…" />

          <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                  {["Tag", "Asset", "Auditor", "Audited At", "Outcome", "Notes"].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 font-semibold" style={{ color: "var(--text-secondary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-8 text-center" style={{ color: "var(--text-muted)" }}>No audit records yet.</td></tr>
                ) : records.map((r, i) => (
                  <tr key={r.id} className="border-t" style={{ borderColor: "var(--border-subtle)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)" }}>
                    <td className="px-3 py-2.5 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>{r.assetTag}</td>
                    <td className="px-3 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{r.assetName}</td>
                    <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{r.auditor}</td>
                    <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{r.auditedAt}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={r.outcome} /></td>
                    <td className="px-3 py-2.5 max-w-[240px] truncate" style={{ color: r.outcome === "DISCREPANCY" ? "var(--danger)" : "var(--text-muted)" }}>
                      {r.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New Audit Cycle">
        <form onSubmit={(e) => { e.preventDefault(); setModal(false); }} className="space-y-3">
          <FormField label="Cycle Name"><Input required value={form.name} onChange={set("name")} placeholder="Q2 2025 Full Audit" /></FormField>
          <FormField label="Scope"><Input required value={form.scope} onChange={set("scope")} placeholder="All Assets / IT Department" /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date"><Input required type="date" value={form.startDate} onChange={set("startDate")} /></FormField>
            <FormField label="End Date"><Input required type="date" value={form.endDate} onChange={set("endDate")} /></FormField>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" type="button" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Creating…" : "Create Cycle"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
