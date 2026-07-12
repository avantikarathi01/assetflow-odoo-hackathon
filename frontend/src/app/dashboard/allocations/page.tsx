"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar } from "@/components/ui/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal, FormField, Input, SelectField, Btn } from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api";
import { Plus, CheckCircle, XCircle } from "lucide-react";

// TODO: map to backend API
const MOCK_ALLOCATIONS = [
  { id: "1", assetTag: "AST-001", assetName: "Dell XPS 15",    allocatedTo: "John Doe",   allocatedBy: "Admin",  allocatedAt: "2025-01-10", expectedReturn: "2025-03-10", status: "ACTIVE" },
  { id: "2", assetTag: "AST-005", assetName: "MacBook Pro M3", allocatedTo: "Jane Smith", allocatedBy: "Admin",  allocatedAt: "2025-01-15", expectedReturn: "2025-04-15", status: "ACTIVE" },
  { id: "3", assetTag: "AST-009", assetName: "iPad Pro",       allocatedTo: "Mike Chen",  allocatedBy: "Admin",  allocatedAt: "2024-11-01", expectedReturn: "2025-01-01", status: "RETURNED" },
];

const MOCK_TRANSFERS = [
  { id: "1", assetTag: "AST-003", assetName: "HP LaserJet",    from: "Operations", to: "Finance",     requestedBy: "Bob Smith", requestedAt: "2025-01-20", status: "REQUESTED" },
  { id: "2", assetTag: "AST-007", assetName: "Epson Projector",from: "Conf Room A",to: "Conf Room B", requestedBy: "Sarah Kim", requestedAt: "2025-01-18", status: "APPROVED" },
  { id: "3", assetTag: "AST-002", assetName: "iPhone 14 Pro",  from: "Sales",      to: "Marketing",   requestedBy: "Lisa Park", requestedAt: "2025-01-12", status: "REJECTED" },
];

export default function AllocationsPage() {
  const [tab, setTab] = useState<"allocations" | "transfers">("allocations");
  const [search, setSearch] = useState("");
  const [allocModal, setAllocModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ assetId: "", allocatedToUserId: "", expectedReturnAt: "" });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await apiFetch(`/assets/${form.assetId}/allocate`, { method: "POST", body: JSON.stringify(form) });
      setAllocModal(false);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  };

  const approveTransfer = async (id: string) => {
    try { await apiFetch(`/transfers/${id}/approve`, { method: "POST" }); }
    catch { /* TODO: show toast */ }
  };

  const TAB_CLS = (t: string) =>
    `px-3 py-1.5 text-[12px] rounded transition-colors ${tab === t ? "bg-blue-600/20 text-blue-400 font-medium" : "hover:bg-white/5"}`;

  const filteredAlloc = MOCK_ALLOCATIONS.filter((a) =>
    !search || a.assetName.toLowerCase().includes(search.toLowerCase()) || a.allocatedTo.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTrans = MOCK_TRANSFERS.filter((t) =>
    !search || t.assetName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Allocation & Transfer"
        subtitle="Manage asset assignments and transfer requests"
        actions={
          tab === "allocations"
            ? <Btn onClick={() => setAllocModal(true)}><Plus size={12} className="inline mr-1" />Allocate Asset</Btn>
            : null
        }
      />

      <div className="flex gap-1 mb-4 p-1 rounded-lg w-fit" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <button className={TAB_CLS("allocations")} style={tab !== "allocations" ? { color: "var(--text-secondary)" } : {}} onClick={() => setTab("allocations")}>Allocations</button>
        <button className={TAB_CLS("transfers")} style={tab !== "transfers" ? { color: "var(--text-secondary)" } : {}} onClick={() => setTab("transfers")}>Transfer Requests</button>
      </div>

      <FilterBar search={search} onSearch={setSearch} placeholder="Search assets or users…" />

      {tab === "allocations" && (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                {["Tag", "Asset", "Allocated To", "Allocated By", "Since", "Expected Return", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 font-semibold" style={{ color: "var(--text-secondary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAlloc.map((a, i) => (
                <tr key={a.id} className="border-t" style={{ borderColor: "var(--border-subtle)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)" }}>
                  <td className="px-3 py-2.5 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>{a.assetTag}</td>
                  <td className="px-3 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{a.assetName}</td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{a.allocatedTo}</td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{a.allocatedBy}</td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{a.allocatedAt}</td>
                  <td className="px-3 py-2.5" style={{ color: a.expectedReturn < new Date().toISOString().split("T")[0] ? "var(--danger)" : "var(--text-secondary)" }}>
                    {a.expectedReturn}
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge status={a.status} /></td>
                  <td className="px-3 py-2.5">
                    {a.status === "ACTIVE" && (
                      <button className="text-[11px] px-2 py-1 rounded border hover:opacity-80" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                        Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "transfers" && (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                {["Tag", "Asset", "From", "To", "Requested By", "Date", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 font-semibold" style={{ color: "var(--text-secondary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTrans.map((t, i) => (
                <tr key={t.id} className="border-t" style={{ borderColor: "var(--border-subtle)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)" }}>
                  <td className="px-3 py-2.5 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>{t.assetTag}</td>
                  <td className="px-3 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{t.assetName}</td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{t.from}</td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{t.to}</td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{t.requestedBy}</td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{t.requestedAt}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={t.status} /></td>
                  <td className="px-3 py-2.5">
                    {t.status === "REQUESTED" && (
                      <div className="flex gap-1">
                        <button onClick={() => approveTransfer(t.id)} className="p-1 rounded hover:bg-emerald-900/30 transition-colors" title="Approve">
                          <CheckCircle size={13} className="text-emerald-400" />
                        </button>
                        <button className="p-1 rounded hover:bg-red-900/30 transition-colors" title="Reject">
                          <XCircle size={13} className="text-red-400" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={allocModal} onClose={() => setAllocModal(false)} title="Allocate Asset">
        <form onSubmit={handleAllocate} className="space-y-3">
          {error && <p className="text-[12px] text-red-400">{error}</p>}
          <FormField label="Asset ID"><Input required value={form.assetId} onChange={set("assetId")} placeholder="Asset UUID" /></FormField>
          <FormField label="Allocate To (User ID)"><Input required value={form.allocatedToUserId} onChange={set("allocatedToUserId")} placeholder="User UUID" /></FormField>
          <FormField label="Expected Return Date"><Input type="date" value={form.expectedReturnAt} onChange={set("expectedReturnAt")} /></FormField>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" type="button" onClick={() => setAllocModal(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Allocating…" : "Allocate"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
